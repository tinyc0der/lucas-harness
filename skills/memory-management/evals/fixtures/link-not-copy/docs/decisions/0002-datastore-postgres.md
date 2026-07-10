# ADR-0002: Use PostgreSQL as the primary datastore

## Status

Accepted

## Context

The product requires relational integrity and multi-row transactions for its
core workflows.

## Decision

Use PostgreSQL as the primary datastore because its relational model and ACID
transactions match those requirements without application-level workarounds.
