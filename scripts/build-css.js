const fs = require("fs");
const path = require("path");
const { colors } = require("../dist/js/index.js");

// Create directories
const dirs = ["dist/css", "dist/js"];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Generate CSS with only hex values
function generateCoreCSS() {
  let cssContent = "/* Pretty Ugly Colors - Core Colors */\n\n";
  cssContent += ":root {\n";
  
  for (const [colorName, color] of Object.entries(colors)) {
    const shades = Object.keys(color).filter(
      (key) => !["a", "oklch", "p3a"].includes(key)
    );
    
    cssContent += `\n  /* ${colorName} */\n`;
    
    // Hex only
    for (const shade of shades) {
      cssContent += `  --${colorName}-${shade}: ${color[shade]};\n`;
    }
  }
  
  cssContent += "}\n";
  return cssContent;
}

// Generate CSS with modern color formats
function generateModernCSS() {
  let cssContent = "/* Pretty Ugly Colors - Modern Color Formats */\n\n";
  cssContent += ":root {\n";
  
  for (const [colorName, color] of Object.entries(colors)) {
    const shades = Object.keys(color).filter(
      (key) => !["a", "oklch", "p3a"].includes(key)
    );
    
    cssContent += `\n  /* ${colorName} - Advanced Formats */\n`;
    
    // Process each format type directly in this function
    if (color.a) {
      for (const shade of shades) {
        if (color.a[shade]) {
          cssContent += `  --${colorName}-${shade}-alpha: ${color.a[shade]};\n`;
        }
      }
      cssContent += "\n";
    }
    
    if (color.oklch) {
      for (const shade of shades) {
        if (color.oklch[shade]) {
          cssContent += `  --${colorName}-${shade}-oklch: ${color.oklch[shade]};\n`;
        }
      }
      cssContent += "\n";
    }
    
    if (color.p3a) {
      for (const shade of shades) {
        if (color.p3a[shade]) {
          cssContent += `  --${colorName}-${shade}-p3a: ${color.p3a[shade]};\n`;
        }
      }
      cssContent += "\n";
    }
  }
  
  cssContent += "}\n";
  return cssContent;
}

// Process the DPS runtime - Safer approach without aggressive obfuscation
function processDPSRuntime() {
  try {
    // Read the compiled DPS runtime
    const runtimePath = path.join(__dirname, "..", "dist/js", "dps-runtime.js");
    let runtimeContent = fs.readFileSync(runtimePath, "utf8");
    
    // Create runtime data
    const runtimeColors = createRuntimeColors();
    
    const colorsJson = JSON.stringify(runtimeColors);
    
    // Safer function name replacements - preserve structure
    runtimeContent = runtimeContent
      .replace(/applyModifierRuntime/g, '_aM')
      .replace(/processDPSValue/g, '_pV')
      .replace(/processStylesheet/g, '_pS')
      .replace(/initDPS/g, '_iD');
    
    // Safer replacement of window objects
    runtimeContent = runtimeContent.replace(
      /window\.__PRETTY_UGLY_COLORS__\s*=\s*window\.__PRETTY_UGLY_COLORS__\s*\|\|\s*{};/,
      `window.__PRETTY_UGLY_COLORS__ = window.__PRETTY_UGLY_COLORS__ || ${colorsJson};`
    );
    
    // Remove token-related code
    runtimeContent = runtimeContent.replace(
      /window\.__PRETTY_UGLY_TOKENS__\s*=\s*window\.__PRETTY_UGLY_TOKENS__\s*\|\|\s*{};/,
      ''
    );
    
    // Validate that the output is valid JavaScript
    try {
      // Simple syntax validation by trying to parse it
      // This won't catch all errors but helps with obvious ones
      Function(runtimeContent);
      console.log("Runtime processed successfully and validated.");
    } catch (syntaxError) {
      console.error("Syntax error in processed runtime:", syntaxError);
      // Fall back to the original file
      runtimeContent = fs.readFileSync(runtimePath, "utf8");
      console.log("Using original runtime file instead.");
    }
    
    return runtimeContent;
  } catch (error) {
    console.error("Error processing runtime:", error);
    return "// Error processing runtime file";
  }
}

// Helper to create runtime colors data
function createRuntimeColors() {
  const runtimeColors = {};
  
  for (const [colorName, color] of Object.entries(colors)) {
    runtimeColors[colorName] = {};
    
    // Add shades
    const shades = Object.keys(color).filter(
      (key) => !["a", "oklch", "p3a"].includes(key)
    );
    
    for (const shade of shades) {
      runtimeColors[colorName][shade] = color[shade];
    }
    
    // Add variants
    if (color.a) runtimeColors[colorName].a = color.a;
    if (color.oklch) runtimeColors[colorName].oklch = color.oklch;
    if (color.p3a) runtimeColors[colorName].p3a = color.p3a;
  }
  
  return runtimeColors;
}

// Write files
function writeFile(relativePath, content) {
  try {
    const filePath = path.join(__dirname, "..", relativePath);
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Generated ${relativePath}`);
  } catch (error) {
    console.error(`Failed to write ${relativePath}:`, error);
  }
}

// Generate files
try {
  const coreCSS = generateCoreCSS();
  writeFile("dist/css/colors.css", coreCSS);

  const modernCSS = generateModernCSS();
  writeFile("dist/css/colors-modern.css", modernCSS);

  const processedRuntime = processDPSRuntime();
  writeFile("dist/js/runtime.js", processedRuntime);

  console.log("All files generated successfully!");
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}