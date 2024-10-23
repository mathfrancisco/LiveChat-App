import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private baseUrl = 'http://localhost:8080';
  private imageCache = new Map<string, string>();

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/api/upload`, formData);
  }

  downloadFile(fileName: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/api/files/${fileName}`, {
      responseType: 'blob'
    });
  }

  // Novo método para obter URL da imagem para preview
  getImageUrl(fileName: string): Observable<string> {
    // Verifica se já temos a URL em cache
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

  // Método para limpar URLs quando não forem mais necessárias
  revokeImageUrl(fileName: string) {
    const url = this.imageCache.get(fileName);
    if (url) {
      URL.revokeObjectURL(url);
      this.imageCache.delete(fileName);
    }
  }
}
