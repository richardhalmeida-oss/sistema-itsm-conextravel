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
      origin: '*', // Permit all initially
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    
    // Vercel Serverless environment strips '/api' from the incoming request path if the file is inside the 'api/' directory
    // So the request url becomes '/v1/auth/login' instead of '/api/v1/auth/login'
    nestApp.setGlobalPrefix('v1');
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
