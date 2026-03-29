import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AvatarModule } from 'primeng/avatar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputMaskModule } from 'primeng/inputmask';
import { MessageService, ConfirmationService } from 'primeng/api'; // Add ConfirmationService
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { UserService } from '../../../../core/services/user/user.service';
import { User, UserRequest } from '../../../../core/models';
import { Subscription } from 'rxjs';
import { ImageService } from '../../../../core/services/image/image.service';
import { Image, ImageType } from '../../../../core/models/image';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    AvatarModule,
    CardModule,
    DividerModule,
    InputMaskModule,
    DialogModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser!: User;
  loading = true;

  editMode = false;
  showPasswordDialog = false;
  showAvatarDialog = false;
  newPassword = '';
  confirmPassword = '';

  // Lista de imágenes de usuario disponibles
  userImages: Image[] = [];

  private subscriptions = new Subscription();

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService, // Add this
    private authService: AuthService,
    private userService: UserService,
    private imageService: ImageService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUserImages();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadCurrentUser(): void {
    this.loading = true;
    const authSub = this.authService.currentUser.subscribe((authUser: any) => {
      if (authUser && authUser.id) {
        const userSub = this.userService.findById(authUser.id).subscribe({
          next: (user) => {
            if (user) {
              this.currentUser = user as User;
              this.loading = false;
            }
          },
          error: (error) => {
            console.error('Error loading user details:', error);
            this.loading = false;
          },
        });

        this.subscriptions.add(userSub);
      } else {
        this.loading = false;
      }
    });

    this.subscriptions.add(authSub);
  }

  loadUserImages(): void {
    const imageSub = this.imageService.findByType(ImageType.USER).subscribe({
      next: (images) => {
        if (Array.isArray(images)) {
          this.userImages = images;
        }
      },
      error: (error) => {
        console.error('Error loading user images:', error);
      },
    });

    this.subscriptions.add(imageSub);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.confirmSaveChanges();
    }
  }

  confirmSaveChanges(): void {
    this.confirmationService.confirm({
      target: event?.target as EventTarget,
      message: '¿Estás seguro de que deseas guardar los cambios?',
      header: 'Confirmar actualización',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Guardar',
        severity: 'success',
      },
      accept: () => {
        this.saveChanges();
      },
      reject: () => {
        this.loadCurrentUser();
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Has cancelado la actualización del perfil',
          life: 3000,
        });
      },
    });
  }

  saveChanges(): void {
    if (!this.currentUser?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede actualizar el usuario sin ID',
      });
      return;
    }

    // Prepare the data to be sent
    const userUpdate: UserRequest = {
      first_name: this.currentUser.first_name,
      last_name: this.currentUser.last_name,
      email: this.currentUser.email,
      phone: this.currentUser.phone,
      username: this.currentUser.username,
      image_id: this.currentUser.image?.id,
    };

    if (this.newPassword) {
      userUpdate.password = this.newPassword;
    }

    const userId = this.currentUser.id;

    const updateSub = this.userService.update(userId, userUpdate).subscribe({
      next: () => {
        this.currentUser.first_name = userUpdate.first_name!;
        this.currentUser.last_name = userUpdate.last_name!;
        this.currentUser.email = userUpdate.email!;
        this.currentUser.phone = userUpdate.phone!;
        this.currentUser.username = userUpdate.username!;
        this.currentUser.password = userUpdate.password!;

        this.authService.updateCurrentUser(this.currentUser);

        this.messageService.add({
          severity: 'success',
          summary: 'Perfil actualizado',
          detail: 'Los cambios han sido guardados correctamente',
        });

        this.editMode = false;
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron guardar los cambios',
        });
      },
    });

    this.subscriptions.add(updateSub);
  }

  cancelPasswordChange(): void {
    this.showPasswordDialog = false;
    this.newPassword = '';
    this.confirmPassword = '';
  }

  openPasswordDialog(): void {
    this.showPasswordDialog = true;
    this.newPassword = '';
    this.confirmPassword = '';
  }

  changePassword(): void {
    if (!this.currentUser.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede cambiar la contraseña sin ID de usuario',
      });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Las contraseñas no coinciden',
      });
      return;
    }

    this.confirmationService.confirm({
      target: event?.target as EventTarget,
      message: '¿Estás seguro de que deseas cambiar tu contraseña?',
      header: 'Confirmar cambio de contraseña',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Cambiar',
        severity: 'success',
      },
      accept: () => {
        this.saveChanges();
        this.showPasswordDialog = false;
        this.newPassword = '';
        this.confirmPassword = '';
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Has cancelado el cambio de contraseña',
          life: 3000,
        });
      },
    });
  }

  openAvatarDialog(): void {
    this.showAvatarDialog = true;
  }

  selectAvatar(imageId: number): void {
    if (!this.currentUser?.id) {
      // Added optional chaining
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede actualizar la imagen sin ID de usuario',
      });
      return;
    }

    // Find the selected image object
    const selectedImageObject = this.userImages.find(
      (img) => img.id === imageId,
    );
    if (!selectedImageObject) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Imagen seleccionada no encontrada.',
      });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas cambiar tu imagen de perfil?',
      header: 'Confirmar cambio de imagen',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
      },
      acceptButtonProps: {
      },
      accept: () => {
        // Optimistically update the UI
        this.currentUser = {
          ...this.currentUser,
          image: selectedImageObject,
        };

        if (!this.currentUser || !this.currentUser.id) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Usuario no encontrado.',
          });
          return;
        }

        // Prepare data for the backend update
        const userUpdate: UserRequest = {
          first_name: this.currentUser.first_name,
          last_name: this.currentUser.last_name,
          email: this.currentUser.email,
          phone: this.currentUser.phone,
          username: this.currentUser.username,
          image_id: imageId,
        };

        // Call the backend
        const updateSub = this.userService
          .update(this.currentUser.id, userUpdate)
          .subscribe({
            next: () => {
              // Update AuthService state
              this.authService.updateCurrentUser(this.currentUser);

              this.messageService.add({
                severity: 'success',
                summary: 'Imagen actualizada',
                detail: 'Tu imagen de perfil ha sido actualizada correctamente',
              });
              this.showAvatarDialog = false; // Close dialog on success
            },
            error: (error) => {
              console.error('Error updating user image:', error);
              // Revert optimistic UI update on error
              this.loadCurrentUser(); // Reload to get the original state
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo actualizar la imagen de perfil',
              });
            },
          });
        this.subscriptions.add(updateSub);
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Has cancelado el cambio de imagen de perfil',
          life: 3000,
        });
      },
    });
  }

  getCurrentAvatarUrl(): string {
    return this.currentUser?.image?.file?.url || 'assets/User.webp';
  }
}
