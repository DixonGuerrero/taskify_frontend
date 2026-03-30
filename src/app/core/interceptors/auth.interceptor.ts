import { HttpEvent, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export const authInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const isApiUrl = req.url.startsWith(environment.API_URL);

  if (isApiUrl) {
    const clonedReq = req.clone({
      withCredentials: true,
    });
    return next(clonedReq);
  } else {
    return next(req);
  }
};
