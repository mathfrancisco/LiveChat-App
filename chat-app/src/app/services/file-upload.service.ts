import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private imageCache = new Map<string, string>();

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(environment.fileUploadUrl, formData);
  }

  downloadFile(fileName: string): Observable<Blob> {
    return this.http.get(`${environment.fileDownloadUrl}/${fileName}`, {
      responseType: 'blob'
    });
  }

  getImageUrl(fileName: string): Observable<string> {
    if (this.imageCache.has(fileName)) {
      return new Observable(observer => {
        observer.next(this.imageCache.get(fileName));
        observer.complete();
      });
    }

    return this.downloadFile(fileName).pipe(
      map(blob => {
        const url = URL.createObjectURL(blob);
        this.imageCache.set(fileName, url);
        return url;
      })
    );
  }

  revokeImageUrl(fileName: string) {
    const url = this.imageCache.get(fileName);
    if (url) {
      URL.revokeObjectURL(url);
      this.imageCache.delete(fileName);
    }
  }
}
