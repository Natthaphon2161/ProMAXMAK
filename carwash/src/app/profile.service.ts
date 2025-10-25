import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:3000/profile';

  constructor(private http: HttpClient) { }

  getProfile(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${username}`);
  }

  updateUserProfile(username: string, userProfile: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-profile`, { username, userProfile });
  }
}
