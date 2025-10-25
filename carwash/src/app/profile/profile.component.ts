import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../profile.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; // Import SweetAlert2

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userProfile: any = {};
  isEditing: boolean = false;

  constructor(private profileService: ProfileService, private router: Router) { }

  ngOnInit(): void {
    const username = localStorage.getItem('username');
    if (username) {
      this.profileService.getProfile(username).subscribe(
        data => {
          this.userProfile = data;
        },
        error => {
          console.error('Error fetching profile:', error);
          this.router.navigate(['/login']);
        }
      );
    } else {
      this.router.navigate(['/login']);
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  updateProfile() {
  const { username, firstname, lastname, phonenumber, email } = this.userProfile;
  this.profileService.updateUserProfile(username, { firstname, lastname, phonenumber, email }).subscribe(
    response => {
      console.log('Profile updated:', response);
      // Display success message using SweetAlert2
      Swal.fire({
        title: 'Success!',
        text: 'Profile updated successfully!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      this.isEditing = false;
    },
    error => {
      console.error('Error updating profile:', error);

      // Check if error response has a specific structure or status code
      const errorMessage = error.error?.message || 'There was an error updating your profile.';
      Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  );
}
}
