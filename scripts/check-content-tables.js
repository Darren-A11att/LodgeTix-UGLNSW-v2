#!/usr/bin/env node

const http = require('http');
const https = require('https');

// Check if the dev server is running
const checkDevServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.end();
  });
};

// Make the API request to check tables
const checkTables = async () => {
  const isDevServerRunning = await checkDevServer();
  
  if (!isDevServerRunning) {
    console.error('Error: Development server is not running. Start it with "npm run dev" first.');
    process.exit(1);
  }
  
  const url = 'http://localhost:3000/api/check-tables';
  console.log(`Checking content tables via ${url}...`);
  
  http.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('Result:', JSON.stringify(result, null, 2));
        
        if (result.checks) {
          const allTablesExist = result.checks.every(check => check.exists);
          if (allTablesExist) {
            console.log('\nAll content tables exist!');
          } else {
            console.log('\nSome content tables are missing:');
            result.checks.forEach(check => {
              if (!check.exists) {
                console.log(`- ${check.table}: ${check.error}`);
              }
            });
          }
        } else if (result.tables) {
          const contentTables = [
            'content',
            'content_features',
            'content_values'
          ];
          
          const existingContentTables = contentTables.filter(table => 
            result.tables.includes(table)
          );
          
          console.log('\nContent tables found:', existingContentTables.length);
          existingContentTables.forEach(table => console.log(`- ${table}`));
          
          const missingTables = contentTables.filter(table => 
            !result.tables.includes(table)
          );
          
          if (missingTables.length > 0) {
            console.log('\nMissing content tables:');
            missingTables.forEach(table => console.log(`- ${table}`));
          }
        }
      } catch (error) {
        console.error('Error parsing response:', error);
      }
    });
  }).on('error', (error) => {
    console.error('Error making request:', error);
  });
};

checkTables();