import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

interface ServiceType {
  serviceid?: number;
  name: string;
  price: number;
  size: string;
}

@Component({
  selector: 'app-service-type',
  templateUrl: './service-type.component.html',
  styleUrls: ['./service-type.component.css']
})
export class ServiceTypeComponent implements OnInit {
  serviceTypes: ServiceType[] = [];
  serviceTypeForm: FormGroup;
  isModalOpen = false;
  isEditMode = false;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.serviceTypeForm = this.fb.group({
      serviceid: [null],
      name: ['', [Validators.required, Validators.minLength(2)]],
      price: [null, [Validators.required, Validators.min(0)]],
      size: ['', Validators.required]
    });
  }

  // Getters สำหรับการเข้าถึงฟอร์มคอนโทรลในเทมเพลต
  get nameControl() { return this.serviceTypeForm.get('name'); }
  get priceControl() { return this.serviceTypeForm.get('price'); }
  get sizeControl() { return this.serviceTypeForm.get('size'); }

  ngOnInit(): void {
    this.loadServiceTypes();
  }

  loadServiceTypes(): void {
    this.http.get<ServiceType[]>('http://localhost:3000/api/servicetypes').subscribe({
      next: (data) => {
        this.serviceTypes = data;
      },
      error: () => {
        Swal.fire('Error!', 'Failed to load service types.', 'error');
      }
    });
  }

  openAddEditModal(serviceType?: ServiceType): void {
    this.isEditMode = !!serviceType;
    this.serviceTypeForm.reset();
    if (serviceType) {
      this.serviceTypeForm.patchValue(serviceType);
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.serviceTypeForm.reset();
  }

  onSubmit(): void {
    if (this.serviceTypeForm.invalid) {
      this.serviceTypeForm.markAllAsTouched();
      Swal.fire('Error!', 'Please fill in all required fields correctly.', 'error');
      return;
    }

    const formData = this.serviceTypeForm.value;
    if (this.isDuplicateServiceType(formData, formData.serviceid)) {
      Swal.fire('Error!', 'Service type with the same Name and Size already exists.', 'error');
      return;
    }

    const request = this.isEditMode
      ? this.http.put(`http://localhost:3000/api/servicetypes/${formData.serviceid}`, formData)
      : this.http.post('http://localhost:3000/api/servicetypes', formData);

    request.subscribe({
      next: () => {
        Swal.fire('Success!', this.isEditMode ? 'Service type updated successfully.' : 'Service type created successfully.', 'success');
        this.loadServiceTypes();
        this.closeModal();
      },
      error: () => {
        Swal.fire('Error!', this.isEditMode ? 'Failed to update service type.' : 'Failed to create service type.', 'error');
      }
    });
  }

  isDuplicateServiceType(newServiceType: ServiceType, serviceIdToIgnore: number | null): boolean {
    return this.serviceTypes.some(
      (serviceType) =>
        serviceType.name === newServiceType.name &&
        serviceType.size === newServiceType.size &&
        serviceType.serviceid !== serviceIdToIgnore
    );
  }

  confirmDelete(serviceId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this service type!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#2563eb',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:3000/api/servicetypes/${serviceId}`).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Your service type has been deleted.', 'success');
            this.loadServiceTypes();
          },
          error: () => {
            Swal.fire('Error!', 'Failed to delete service type.', 'error');
          }
        });
      }
    });
  }
}