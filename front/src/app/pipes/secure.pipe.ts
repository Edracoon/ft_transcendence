import { HttpClient } from '@angular/common/http';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Pipe({
  name: 'secure',
})
export class SecurePipe implements PipeTransform {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly sanitizer: DomSanitizer
  ) {}

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.log(error);
      return of(result as T);
    };
  }

  transform(url: string): Observable<SafeUrl> {
    if (url.includes(environment.API_INFINITY))
      return this.httpClient.get(url, { responseType: 'blob' }).pipe(
        map((val: any) =>
          this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(val))
        ),
        catchError(this.handleError<string>('getImage'))
      );
    return of(url);
  }
}
