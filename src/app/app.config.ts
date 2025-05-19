import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import * as countries from 'i18n-iso-countries';
import * as ruLocale from 'i18n-iso-countries/langs/ru.json';
import localeRu from '@angular/common/locales/ru';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';

countries.registerLocale(ruLocale);
registerLocaleData(localeRu);

import { routes } from "./app.routes";


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
  ]
};
