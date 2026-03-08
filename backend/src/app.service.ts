import { Injectable, ConsoleLogger } from '@nestjs/common';

@Injectable()
export class AppService extends ConsoleLogger {
  getHello(): string {
    this.log('Executing getHello method');
    const result = 'Hello World!';
    this.debug(`getHello returned: ${result}`);
    return result;
  }

  testLogging() {
    this.log('This is an info message', 'AppService');
    this.warn('This is a warning message', 'AppService');
    this.error(
      'This is an error message',
      'Stack trace example',
      'AppService',
    );
    this.debug('This is a debug message', 'AppService');
  }
}
