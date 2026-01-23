# n8n Setup with Docker

## Quick Start

### 1. Start n8n
```bash
docker-compose up -d
```

### 2. Access n8n
Open your browser and go to: http://localhost:5678

**Default credentials:**
- Username: `admin`
- Password: `admin123`

### 3. Stop n8n
```bash
docker-compose down
```

### 4. View logs
```bash
docker-compose logs -f n8n
```

## Configuration

### Change Credentials
Edit the `docker-compose.yml` file and update:
```yaml
- N8N_BASIC_AUTH_USER=your_username
- N8N_BASIC_AUTH_PASSWORD=your_password
```

### Import Workflows
Your workflows are already mounted at `/workflows` inside the container. 
To import workflows:
1. Go to http://localhost:5678
2. Click "Workflows" → "Import from File"
3. Navigate to `/workflows` directory
4. Select your workflow JSON files

### Available Workflows
- `DOC.X Intelligent - Gmail Document Processor.json`
- `kmrl-email-processor.json`
- `multi-platform-document-processor.json`

## Troubleshooting

### Check if containers are running
```bash
docker ps
```

### Restart n8n
```bash
docker-compose restart n8n
```

### View n8n container logs
```bash
docker logs n8n -f
```

### Reset everything (WARNING: deletes all data)
```bash
docker-compose down -v
docker-compose up -d
```

## Integration with Backend

The backend directory is mounted at `/backend` inside the n8n container.
You can reference Python scripts in your n8n workflows using:
```
/backend/script_name.py
```

## Volumes

- `n8n_data`: Stores n8n workflow data and credentials
- `postgres_data`: PostgreSQL database for n8n
- `./workflows`: Your workflow JSON files
- `./backend`: Your Python backend scripts
- `./test documents`: Sample documents for testing

## Network

All services are on the `n8n-network` bridge network and can communicate with each other.

## Production Notes

⚠️ **Before deploying to production:**
1. Change default credentials
2. Use HTTPS (set `N8N_PROTOCOL=https`)
3. Set proper webhook URL
4. Use strong PostgreSQL passwords
5. Configure proper backup for volumes
6. Set up SSL certificates
7. Configure firewall rules

## Useful Commands

```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Stop services
docker-compose down

# Update n8n to latest version
docker-compose pull
docker-compose up -d

# Access n8n CLI
docker exec -it n8n n8n --help

# Backup data
docker run --rm -v n8n_data:/data -v $(pwd):/backup ubuntu tar czf /backup/n8n-backup.tar.gz /data

# Restore data
docker run --rm -v n8n_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/n8n-backup.tar.gz -C /
```
