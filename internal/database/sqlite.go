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

	"github.com/georgysavva/scany/sqlscan"
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
	if _, err := os.Stat(dir); os.IsNotExist(err) {
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
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sqlite.sql") {
			migrationFiles = append(migrationFiles, file.Name())
		}
	}
	sort.Strings(migrationFiles)

	var allMigrations strings.Builder
	for _, fileName := range migrationFiles {
		filePath := filepath.Join(db.migrationsDir, fileName)
		sqlBytes, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", filePath, err)
		}
		allMigrations.Write(sqlBytes)
		allMigrations.WriteString(";\n")
	}

	if _, err = db.db.ExecContext(ctx, allMigrations.String()); err != nil {
		return fmt.Errorf("failed to run sqlite migrations: %w", err)
	}
	return nil
}

func SQLiteExec(ctx context.Context, db SQLiteDBTX, sql string, args ...any) error {
	_, err := db.ExecContext(ctx, sql, args...)
	if err != nil {
		return fmt.Errorf("db.ExecContext failed: %w", err)
	}
	return nil
}

func SQLiteQueryRow[T any](ctx context.Context, db SQLiteDBTX, sql string, args ...any) (T, error) {
	var entity T
	err := sqlscan.Get(ctx, db, &entity, sql, args...)
	if err != nil {
		if sqlscan.NotFound(err) {
			return entity, ErrNotFound
		}
		return entity, fmt.Errorf("sqlscan.Get failed: %w", err)
	}
	return entity, nil
}

func SQLiteQuery[T any](ctx context.Context, db SQLiteDBTX, sql string, args ...any) ([]T, error) {
	var entities []T
	err := sqlscan.Select(ctx, db, &entities, sql, args...)
	if err != nil {
		return nil, fmt.Errorf("sqlscan.Select failed: %w", err)
	}
	return entities, nil
}