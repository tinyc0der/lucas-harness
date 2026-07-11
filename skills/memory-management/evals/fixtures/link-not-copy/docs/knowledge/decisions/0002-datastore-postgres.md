---
type: Architecture Decision
title: "ADR-0002: Use PostgreSQL as the primary datastore"
description: Use PostgreSQL for relational integrity and multi-row transactions.
tags: [architecture, database]
status: accepted
---

# ADR-0002: Use PostgreSQL as the primary datastore

## Status

Accepted

## Context

The product requires relational integrity and multi-row transactions for its
core workflows, as constrained by the [project contract](/project.md).

## Decision

Use PostgreSQL as the primary datastore because its relational model and ACID
transactions match those requirements without application-level workarounds.
