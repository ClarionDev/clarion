package database

import (
	"context"
	"errors"
	"fmt"
)

var ErrNotFound = errors.New("record not found")

type DB interface {
	RunMigrations(ctx context.Context) error
	Close()
	Handle() any
}

func New(ctx context.Context, driver, connString string) (DB, error) {
	switch driver {
	case "sqlite":
		migrationsDir := "./db/migrations"
		return NewSQLite(ctx, connString, migrationsDir)
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", driver)
	}
}
