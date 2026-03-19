const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');
const express = require('express');
const serverless = require('serverless-http');

// Vercel Serverless Function entry point pointing to the COMPILED App Module
const { AppModule } = require('../dist/app.module');

let cachedServer;

async function bootstrap() {
  if (!cachedServer) {
    const expressApp = express();
    
    // Manually handle CORS at the Express level to be 100% sure Vercel sees the headers
    expressApp.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      next();
    });

    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { logger: ['error', 'warn'] } 
    );
    
    // Ensure Nest correctly identifies routes whether they come with the /api prefix or not
    nestApp.setGlobalPrefix('api/v1');
    nestApp.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    
    await nestApp.init();
    cachedServer = serverless(expressApp);
  }
  return cachedServer;
}

module.exports = async function handler(req, res) {
  const server = await bootstrap();
  return server(req, res);
};
