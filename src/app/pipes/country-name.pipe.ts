import { Pipe, PipeTransform } from '@angular/core';
import * as countries from 'i18n-iso-countries';

@Pipe({
  name: 'countryName'
})
export class CountryNamePipe implements PipeTransform {

  transform(code: string, lang: string = 'ru'): string {
    if (!code) return '';
    const name = countries.getName(code.toUpperCase(), lang);
    return name || code;
  }

}
