import {Component, effect, ResourceStatus, signal} from '@angular/core';
import {httpResource} from '@angular/common/http';

import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {sample, Subject} from 'rxjs';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {DatePipe, DecimalPipe, UpperCasePipe} from '@angular/common';
import {CountryNamePipe} from './pipes/country-name.pipe';
import {currentMonitor, getCurrentWindow} from "@tauri-apps/api/window";


type WeatherResponse = {
    coord: {
        lon: "number",
        lat: "number"
    },
    weather: {
        id: "number",
        main: "string",
        description: "string",
        icon: "string"
    }[],
    base: "string",
    main: {
        temp: "number",
        feels_like: "number",
        temp_min: "number",
        temp_max: "number",
        pressure: "number",
        humidity: "number"
    },
    visibility: "number",
    wind: {
        speed: "number",
        deg: "number",
        gust?: "number"
    },
    dt: "number",
    sys: {
        type: "number",
        id: "number",
        country: "string",
        sunrise: "number",
        sunset: "number"
    },
    timezone: "number",
    id: "number",
    name: "string",
    cod: "number"
}

type ForecastViewDay = {
    date: string;
    min: number;
    max: number;
    icon: string;
    description: string;
}

@Component({
    selector: 'app-root',
    imports: [
        MatProgressSpinner,
        MatIcon,
        MatIconModule,
        MatIconButton,
        DecimalPipe,
        CountryNamePipe,
        DatePipe,
        UpperCasePipe,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
    readonly resourceStatus = ResourceStatus;
    API_KEY = 'c79aa627a661073fa904434f614ba80b';
    query = signal('');
    action = new Subject<void>();
    urlImg = `http://openweathermap.org/img/wn/`
    sampleQuery = toSignal(toObservable(this.query).pipe(
        sample(this.action.asObservable())
    ));

    constructor() {
        effect(() => {
            switch (this.weatherResource.status()) {
                case ResourceStatus.Resolved:
                    this.resizeWindow(484);
                    break;
                case ResourceStatus.Loading:
                    this.resizeWindow(148);
                    break;
                case ResourceStatus.Error:
                    this.resizeWindow(138);
                    break;
            }
        });
    }

    weatherResource = httpResource<WeatherResponse>(
        () => {
            const query = this.sampleQuery();
            return query ? `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${this.API_KEY}&lang=ru&units=metric` : undefined;
        },
    );


    forecastResource = httpResource<ForecastViewDay[]>(() => {
        const weather = this.weatherResource.value();
        if (!weather) return undefined;

        const {lat, lon} = weather.coord;
        return {
            url: `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric&lang=ru`
        }
    }, {
        parse: (res: any) => {
            const dailyMap = new Map<string, any[]>();

            // res.list - массив погодных прогнозов на каждые 3 часа на 5 дней вперёд
            for (const entry of res.list) {
                const date = new Date(entry.dt * 1000).toISOString().split('T')[0]; // '2025-04-27T09:00:00.000Z' => '2025-04-27'
                if (!dailyMap.has(date)) dailyMap.set(date, []); // Проверяем: есть ли в Map уже ключ с этой датой
                dailyMap.get(date)!.push(entry);
            }

            return Array.from(dailyMap.entries())
                .slice(0, 5)
                .map(([date, entries]) => {
                    const temps = entries.map(e => e.main.temp);
                    const min = Math.min(...temps);
                    const max = Math.max(...temps);
                    const icon = entries[0].weather[0].icon;
                    const description = entries[0].weather[0].description;

                    return {date, min, max, icon, description};
                });
        }
    });

    async resizeWindow(height: number) {
        const monitor = await currentMonitor();
        const physicalSize = await getCurrentWindow().innerSize();
        const scaleFactor = monitor!.scaleFactor;
        const logicalSize = physicalSize.toLogical(scaleFactor);

        logicalSize.height = height;
        await getCurrentWindow().setSize(logicalSize);
    }
}