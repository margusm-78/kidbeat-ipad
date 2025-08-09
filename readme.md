# KidBeat - Mobile Drum Machine for iPad

A touch-optimized Progressive Web App drum machine designed specifically for iPad and mobile devices. Create beats on-the-go with professional Web Audio synthesis.

## 🎵 Features

- **16-step drum sequencer** with 4 tracks (Kick, Snare, Hi-Hat, Clap)
- **Touch-optimized interface** designed for iPad
- **Progressive Web App** - install to home screen
- **Professional audio synthesis** using Web Audio API
- **Save/Load patterns** locally on device
- **Export to WAV** files
- **Swing timing** and per-track volume controls
- **No internet required** - works completely offline
- **Privacy-focused** - no data collection or uploads

## 📱 Installation on iPad

1. Open Safari on your iPad
2. Navigate to the deployed app URL
3. Tap the **Share** button (square with arrow)
4. Select **Add to Home Screen**
5. Tap **Add** to install as a native-like app

## 🚀 Quick Start

### For Users
Simply visit the deployed URL and start making beats! The app works immediately in any modern browser.

### For Developers

```bash
# Clone the repository
git clone https://github.com/yourusername/kidbeat-ipad.git
cd kidbeat-ipad

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
kidbeat-ipad/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker for offline support
│   ├── icons/                 # App icons for various sizes
│   └── index.html             # Main HTML file
├── src/
│   ├── App.jsx                # Main React component
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global styles
│   └── components/            # Additional components (if needed)
├── package.json
├── vite.config.js             # Vite configuration
└── README.md
```

## 🎛️ Usage

### Creating Beats
1. **Tap squares** to activate/deactivate steps
2. **Use volume sliders** to adjust track levels  
3. **All/None buttons** to quickly fill or clear tracks
4. **Adjust tempo** with the BPM slider (60-160 BPM)
5. **Add swing** for groove (0-100%)

### Playback Controls
- **▶️ Play**: Start playback
- **⏹ Stop**: Stop and reset to beginning
- **Current step indicator** shows playback position

### Pattern Management
- **Save**: Store your beat locally
- **Load**: Recall saved patterns
- **Export WAV**: Download as audio file
- **Delete**: Remove saved patterns

### Quick Actions
- **🎲 Surprise Beat**: Generate random pattern
- **🧽 Clear**: Reset all steps

## 🛠️ Technical Details

### Audio Engine
- **Web Audio API** for professional synthesis
- **Shared noise buffers** for optimal performance
- **Precision timing** with lookahead scheduling
- **iOS audio unlock** for mobile compatibility

### Mobile Optimization
- **Touch-friendly** button sizes (44px minimum)
- **Responsive grid** layout
- **Optimized for portrait** and landscape modes
- **PWA features** for app-like experience
- **Offline functionality** with service worker

### Performance
- **Memoized audio buffers** to reduce CPU usage
- **Efficient React renders** with proper state management
- **Minimal bundle size** with tree-shaking

## 🔧 Development

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Building for Production
The app is optimized for deployment to static hosting services:

```bash
npm run build
```

Deploy the `dist/` folder to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

## 📱 PWA Features

- **Installable** - Add to home screen
- **Offline capable** - Works without internet
- **App-like experience** - Full screen, no browser UI
- **Fast loading** - Cached resources
- **Responsive** - Works on all screen sizes

## 🎨 Customization

### Adding New Drum Sounds
Edit the `TRACKS` array in `App.jsx` and add corresponding audio synthesis functions.

### Changing Colors/Themes
Modify the Tailwind classes or add custom CSS variables.

### Extending Features
The modular structure makes it easy to add:
- More tracks
- Effects processing  
- Pattern variations
- MIDI support
- Cloud sync

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/) and [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Audio synthesis using [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## 📞 Support

- 🐛 [Report Issues](https://github.com/yourusername/kidbeat-ipad/issues)
- 💡 [Request Features](https://github.com/yourusername/kidbeat-ipad/issues)
- 📖 [Documentation](https://github.com/yourusername/kidbeat-ipad/wiki)

---

Made with ❤️ for mobile music creators

## 🚀 Deploy to GitHub Pages

Add this workflow file as `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```