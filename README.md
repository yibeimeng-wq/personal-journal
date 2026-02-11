# 📓 Personal Journal

A private, secure personal journaling website with complete privacy control.

## ✨ Features

### Write & Manage
- **Create journals** with title and content
- **Multi-language support**: 中文, English, or mixed content
- **English grammar checking** with basic suggestions
- **Edit journals** anytime after creation
- **Delete journals** with confirmation

### Privacy & Security
- **Your data, your control** - no public registration
- **Password-protected** owner account
- **Public read access** - share if you want, private by default
- **All data stored locally** on your server

### Access Anywhere
- **Mobile & Desktop** responsive design
- **Global access** - works from China and anywhere else
- **No external dependencies** - runs completely standalone

### Statistics
- Track weekly journal creation, updates, and deletions
- Monitor your writing habits

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd personal-journal
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open in Browser
Visit: http://localhost:3000

### 4. Create Your Account
First time visit will prompt you to create an owner account.

## 📱 Usage

### For You (Owner)
1. **Login** with your credentials
2. **Write journals** - Chinese, English, or mixed
3. **Edit or delete** anytime
4. View **weekly statistics**

### Sharing with Others
1. Others can **visit your URL** without login
2. They can **read all your journals**
3. They **cannot edit or delete** anything
4. Perfect for sharing memories with friends/family

## 🌍 Deployment

### Option 1: VPS/Cloud Server (Recommended)
```bash
# Upload files to your server
scp -r personal-journal user@your-server:/path/

# Install and run
ssh user@your-server
cd /path/personal-journal
npm install
npm start

# Use PM2 for production
npm install -g pm2
pm2 start server.js --name journal
```

### Option 2: Railway
1. Connect your GitHub repository
2. Set `PORT` environment variable
3. Deploy!

### Option 3: Render
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`

### Option 4: Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security Notes

1. **Change JWT_SECRET** in `.env` before production
2. **Use HTTPS** in production (reverse proxy with nginx)
3. **Regular backups** of the `data/journal.db` file
4. **Strong password** for your owner account

## 📁 Project Structure

```
personal-journal/
├── server.js          # Backend API
├── package.json        # Dependencies
├── .env                # Configuration
├── data/
│   └── journal.db     # SQLite database (auto-created)
└── public/
    ├── index.html     # Main page
    ├── css/
    │   └── style.css  # Styles
    └── js/
        └── app.js     # Frontend logic
```

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT + bcrypt
- **Frontend**: Vanilla HTML/CSS/JS (no frameworks)
- **Styling**: Custom CSS (responsive)

## 📊 API Endpoints

### Public (Read-only)
- `GET /api/journals` - List all journals
- `GET /api/journals/:id` - Get single journal

### Authenticated (Owner only)
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/journals` - Create journal
- `PUT /api/journals/:id` - Update journal
- `DELETE /api/journals/:id` - Delete journal
- `GET /api/stats` - View statistics

## 🎯 Metrics Tracked

- Weekly journal creation count
- Weekly update count  
- Weekly deletion count
- Total journals

## 📝 Todo / Future Enhancements

- [ ] Export journals (Markdown/JSON)
- [ ] Search functionality
- [ ] Tags/categories
- [ ] Rich text editor
- [ ] Dark mode
- [ ] Backup/restore
- [ ] Multiple user support
- [ ] Journal export to PDF

## 🤝 Contributing

Ideas welcome! This is a personal project, but feel free to suggest improvements.

## 📄 License

MIT - Use it freely!

---

Built with ❤️ for private journaling
