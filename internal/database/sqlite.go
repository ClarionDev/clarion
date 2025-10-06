package database

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/georgysavva/scany/v2/sqlscan"
	_ "modernc.org/sqlite"
)

var _ DB = (*SQLiteDatabase)(nil)

type SQLiteDBTX interface {
	sqlscan.Querier
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

type SQLiteDatabase struct {
	db            *sql.DB
	migrationsDir string
}

func NewSQLite(ctx context.Context, connString, migrationsDir string) (*SQLiteDatabase, error) {
	if connString == "" {
		return nil, errors.New("database connection string (file path) is empty")
	}

	dir := filepath.Dir(connString)
	if _, err := os.Stat(dir); os.IsNotExist(err) && dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create database directory: %w", err)
		}
	}

	db, err := sql.Open("sqlite", connString+"?_pragma=foreign_keys(1)")
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping sqlite database: %w", err)
	}

	db.SetMaxOpenConns(1)

	return &SQLiteDatabase{db: db, migrationsDir: migrationsDir}, nil
}

func (db *SQLiteDatabase) Close() {
	db.db.Close()
}

func (db *SQLiteDatabase) Handle() any {
	return db.db
}

func (db *SQLiteDatabase) RunMigrations(ctx context.Context) error {
	files, err := os.ReadDir(db.migrationsDir)
	if err != nil {
		return fmt.Errorf("could not read migrations directory %s: %w", db.migrationsDir, err)
	}

	var migrationFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			migrationFiles = append(migrationFiles, file.Name())
		}
	}
	sort.Strings(migrationFiles)

	tx, err := db.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin migration transaction: %w", err)
	}
	defer tx.Rollback() // Rollback is a no-op if Commit succeeds

	for _, fileName := range migrationFiles {
		filePath := filepath.Join(db.migrationsDir, fileName)
		sqlBytes, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", filePath, err)
		}

		if _, err = tx.ExecContext(ctx, string(sqlBytes)); err != nil {
			return fmt.Errorf("failed to run migration %s: %w", fileName, err)
		}
	}

	return tx.Commit()
}
