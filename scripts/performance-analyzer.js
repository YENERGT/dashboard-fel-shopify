#!/usr/bin/env node

// Script para análisis de performance de la aplicación
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Analizando performance de la aplicación...\n');

// Análisis de tamaño de archivos
function analyzeFileSize(dir, results = {}) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      analyzeFileSize(filePath, results);
    } else {
      const ext = path.extname(file);
      if (!results[ext]) results[ext] = { count: 0, size: 0 };
      results[ext].count++;
      results[ext].size += stat.size;
    }
  });
  
  return results;
}

// Análisis del build
function analyzeBuild() {
  const buildPath = path.join(__dirname, '../build');
  
  if (!fs.existsSync(buildPath)) {
    console.log('❌ No se encontró el directorio build/. Ejecuta npm run build primero.');
    return;
  }
  
  console.log('📊 Análisis del build:');
  
  const buildStats = analyzeFileSize(buildPath);
  
  Object.entries(buildStats).forEach(([ext, stats]) => {
    const avgSize = (stats.size / stats.count / 1024).toFixed(2);
    const totalSize = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`  ${ext || 'sin ext'}: ${stats.count} archivos, ${totalSize}MB total, ${avgSize}KB promedio`);
  });
  
  // Archivos más grandes
  console.log('\n📈 Archivos más grandes (>100KB):');
  findLargeFiles(buildPath, 100 * 1024);
}

function findLargeFiles(dir, threshold, results = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findLargeFiles(filePath, threshold, results);
    } else if (stat.size > threshold) {
      results.push({
        file: path.relative(path.join(__dirname, '..'), filePath),
        size: (stat.size / 1024).toFixed(2)
      });
    }
  });
  
  results
    .sort((a, b) => parseFloat(b.size) - parseFloat(a.size))
    .slice(0, 10)
    .forEach(item => {
      console.log(`  ${item.file}: ${item.size}KB`);
    });
  
  return results;
}

// Análisis de dependencias
function analyzeDependencies() {
  console.log('\n📦 Análisis de dependencias:');
  
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
  );
  
  const deps = Object.keys(packageJson.dependencies || {});
  const devDeps = Object.keys(packageJson.devDependencies || {});
  
  console.log(`  Dependencias de producción: ${deps.length}`);
  console.log(`  Dependencias de desarrollo: ${devDeps.length}`);
  
  // Dependencias más pesadas (estimación)
  const heavyDeps = [
    'chart.js', '@shopify/polaris', 'react', 'react-dom', 
    'axios', 'googleapis', 'prisma', 'express'
  ];
  
  const presentHeavyDeps = heavyDeps.filter(dep => deps.includes(dep));
  
  if (presentHeavyDeps.length > 0) {
    console.log('\n⚠️  Dependencias pesadas detectadas:');
    presentHeavyDeps.forEach(dep => {
      console.log(`  - ${dep}`);
    });
  }
}

// Análisis de performance del código
function analyzeCodePerformance() {
  console.log('\n🚀 Análisis de código:');
  
  const srcPath = path.join(__dirname, '../app');
  
  // Buscar patrones anti-performance
  const antiPatterns = {
    'console.log': /console\.log/g,
    'useEffect sin deps': /useEffect\([^,]*\);/g,
    'useState con objetos': /useState\(\{.*\}\)/g,
    'props drilling': /props\.\w+\.\w+\.\w+/g
  };
  
  let totalIssues = 0;
  
  function scanFile(filePath) {
    if (path.extname(filePath) !== '.jsx' && path.extname(filePath) !== '.js') {
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(srcPath, filePath);
    
    Object.entries(antiPatterns).forEach(([pattern, regex]) => {
      const matches = content.match(regex);
      if (matches) {
        console.log(`  ⚠️  ${relativePath}: ${matches.length} ${pattern}`);
        totalIssues += matches.length;
      }
    });
  }
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else {
        scanFile(filePath);
      }
    });
  }
  
  scanDirectory(srcPath);
  
  if (totalIssues === 0) {
    console.log('  ✅ No se encontraron patrones anti-performance obvios');
  } else {
    console.log(`\n  Total de posibles problemas: ${totalIssues}`);
  }
}

// Recomendaciones
function showRecommendations() {
  console.log('\n💡 Recomendaciones de optimización:');
  
  const recommendations = [
    'Usar React.memo para componentes que reciben props estables',
    'Implementar useMemo para cálculos costosos',
    'Usar useCallback para funciones pasadas como props',
    'Considerar code splitting para rutas no críticas',
    'Optimizar imágenes con formatos modernos (WebP, AVIF)',
    'Implementar virtual scrolling para listas grandes',
    'Usar Intersection Observer para lazy loading',
    'Minimizar re-renders con estado local en lugar de global',
    'Precargar recursos críticos con <link rel="preload">',
    'Implementar Service Worker para cache offline'
  ];
  
  recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
}

// Ejecutar análisis
async function main() {
  try {
    analyzeBuild();
    analyzeDependencies();
    analyzeCodePerformance();
    showRecommendations();
    
    console.log('\n✅ Análisis completado!');
    console.log('\n🔧 Para más detalles:');
    console.log('  - npm run build:analyze (análisis visual del bundle)');
    console.log('  - npm run perf:lighthouse (audit de Lighthouse)');
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
    process.exit(1);
  }
}

main();
