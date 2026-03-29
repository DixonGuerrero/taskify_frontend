import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ThemeService } from './app/core/theme/service/theme.service';

const themeService = new ThemeService();
themeService.initializeTheme();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
