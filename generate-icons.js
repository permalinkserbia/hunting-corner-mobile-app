const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceIcon = path.join(__dirname, 'src/statics/icon.png');
const androidResDir = path.join(__dirname, 'android/app/src/main/res');

// Android icon sizes (in dp, actual pixels vary by density)
const iconSizes = {
  'mipmap-mdpi': 48,    // 1x
  'mipmap-hdpi': 72,    // 1.5x
  'mipmap-xhdpi': 96,   // 2x
  'mipmap-xxhdpi': 144, // 3x
  'mipmap-xxxhdpi': 192 // 4x
};

// Splash screen sizes for different densities and orientations
const splashSizes = {
  'drawable-port-mdpi': { width: 320, height: 470 },
  'drawable-port-hdpi': { width: 480, height: 640 },
  'drawable-port-xhdpi': { width: 720, height: 960 },
  'drawable-port-xxhdpi': { width: 1080, height: 1440 },
  'drawable-port-xxxhdpi': { width: 1440, height: 1920 },
  'drawable-land-mdpi': { width: 470, height: 320 },
  'drawable-land-hdpi': { width: 640, height: 480 },
  'drawable-land-xhdpi': { width: 960, height: 720 },
  'drawable-land-xxhdpi': { width: 1440, height: 1080 },
  'drawable-land-xxxhdpi': { width: 1920, height: 1440 },
  'drawable': { width: 720, height: 1280 } // Default splash
};

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function createSquareIcon(inputPath, outputPath, size) {
  // Create a square version of the icon with padding
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  // Calculate padding to make it square
  const maxDimension = Math.max(metadata.width, metadata.height);
  const padding = Math.floor((maxDimension * 1.2 - maxDimension) / 2); // 20% padding
  
  await image
    .resize(maxDimension, maxDimension, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .resize(size, size, {
      fit: 'cover',
      position: 'center'
    })
    .png()
    .toFile(outputPath);
  
  console.log(`Generated ${outputPath} (${size}x${size})`);
}

async function createSplashScreen(inputPath, outputPath, width, height) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  // Calculate how to fit the icon in the splash screen
  // Use 30% of the smaller dimension for the icon size
  const iconSize = Math.min(width, height) * 0.3;
  
  // Resize icon
  const resizedIcon = await image
    .resize(Math.floor(iconSize), null, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();
  
  // Create splash screen with black background and centered icon
  await sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
    }
  })
    .composite([{
      input: resizedIcon,
      gravity: 'center'
    }])
    .png()
    .toFile(outputPath);
  
  console.log(`Generated splash ${outputPath} (${width}x${height})`);
}

async function createAdaptiveIconForeground(inputPath, outputPath) {
  // Adaptive icons need 1024x1024 with safe zone (66.7% of size)
  const size = 1024;
  const safeZone = Math.floor(size * 0.667);
  
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const maxDimension = Math.max(metadata.width, metadata.height);
  
  // Resize to fit within safe zone
  await image
    .resize(safeZone, safeZone, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: Math.floor((size - safeZone) / 2),
      bottom: Math.floor((size - safeZone) / 2),
      left: Math.floor((size - safeZone) / 2),
      right: Math.floor((size - safeZone) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(outputPath);
  
  console.log(`Generated adaptive icon foreground ${outputPath}`);
}

async function main() {
  console.log('Generating Android icons and splash screens...');
  console.log(`Source icon: ${sourceIcon}`);
  
  if (!fs.existsSync(sourceIcon)) {
    console.error(`Source icon not found: ${sourceIcon}`);
    process.exit(1);
  }
  
  try {
    // Generate launcher icons
    console.log('\nGenerating launcher icons...');
    for (const [folder, size] of Object.entries(iconSizes)) {
      const dir = path.join(androidResDir, folder);
      await ensureDir(dir);
      
      // Generate regular icon
      await createSquareIcon(
        sourceIcon,
        path.join(dir, 'ic_launcher.png'),
        size
      );
      
      // Generate round icon (same as regular for now)
      await createSquareIcon(
        sourceIcon,
        path.join(dir, 'ic_launcher_round.png'),
        size
      );
      
      // Generate foreground for adaptive icons
      await createSquareIcon(
        sourceIcon,
        path.join(dir, 'ic_launcher_foreground.png'),
        size
      );
    }
    
    // Generate adaptive icon foreground (1024x1024)
    console.log('\nGenerating adaptive icon foreground...');
    const adaptiveDir = path.join(androidResDir, 'mipmap-xxxhdpi');
    await ensureDir(adaptiveDir);
    await createAdaptiveIconForeground(
      sourceIcon,
      path.join(adaptiveDir, 'ic_launcher_foreground.png')
    );
    
    // Copy to other densities for adaptive icon foreground
    for (const [folder, size] of Object.entries(iconSizes)) {
      if (folder !== 'mipmap-xxxhdpi') {
        const dir = path.join(androidResDir, folder);
        await ensureDir(dir);
        await createSquareIcon(
          sourceIcon,
          path.join(dir, 'ic_launcher_foreground.png'),
          size
        );
      }
    }
    
    // Generate splash screens
    console.log('\nGenerating splash screens...');
    for (const [folder, dimensions] of Object.entries(splashSizes)) {
      const dir = path.join(androidResDir, folder);
      await ensureDir(dir);
      
      await createSplashScreen(
        sourceIcon,
        path.join(dir, 'splash.png'),
        dimensions.width,
        dimensions.height
      );
    }
    
    console.log('\n✅ All icons and splash screens generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Rebuild the Android app');
    console.log('2. The icons will be used automatically');
    
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();

