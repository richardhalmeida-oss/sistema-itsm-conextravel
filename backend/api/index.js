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
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { logger: ['error', 'warn'] } // Minimize logging in serverless to save execution time
    );
    
    nestApp.enableCors({
      origin: true, // Dynamically reflect the request origin (fixes Vercel CORS)
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    
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
