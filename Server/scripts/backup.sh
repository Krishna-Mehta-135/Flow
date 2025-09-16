#!/bin/bash

# Carpool App Database Backup Script

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/logs/backup.log"
MAX_BACKUPS=7

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to create backup
create_backup() {
    log "Starting database backup..."
    
    cd "$PROJECT_DIR"
    
    # Run the backup using Node.js
    if npm run backup; then
        log "Database backup completed successfully"
        
        # Clean up old backups
        log "Cleaning up old backups (keeping last $MAX_BACKUPS)..."
        ls -t "$BACKUP_DIR"/backup-*.json | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
        
        log "Backup process completed"
        return 0
    else
        log "ERROR: Database backup failed"
        return 1
    fi
}

# Main execution
case "${1:-create}" in
    create)
        create_backup
        ;;
    cleanup)
        log "Cleaning up old backups..."
        ls -t "$BACKUP_DIR"/backup-*.json | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
        log "Cleanup completed"
        ;;
    list)
        echo "Available backups:"
        ls -la "$BACKUP_DIR"/backup-*.json 2>/dev/null || echo "No backups found"
        ;;
    *)
        echo "Usage: $0 {create|cleanup|list}"
        echo "  create  - Create a new database backup"
        echo "  cleanup - Remove old backups (keep last $MAX_BACKUPS)"
        echo "  list    - List available backups"
        exit 1
        ;;
esac
