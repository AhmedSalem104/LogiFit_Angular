import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import { IdentitySignInResponse, WorkspaceClientJoinPreview, WorkspaceInvitePreview } from '../../../../core/freelance/models/freelance.models';
type Preview = WorkspaceInvitePreview | WorkspaceClientJoinPreview;
@Component({ selector: 'app-identity-join', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule], changeDetection: ChangeDetectionStrategy.OnPush, template: `
<section><p>1 — 2 — 3</p>
@if (loading()) { <p>جارٍ التحقق…</p> } @else if (!preview()) { <h2>الرابط غير صالح</h2> } @else {
<h2>{{ mode() === 'invite' ? 'دعوة إلى فريق' : 'انضمام عميل' }}</h2><p>{{ workspaceName() }}</p>
@if (!identity()) { <form [formGroup]="form" (ngSubmit)="signIn()"><input type="email" formControlName="email"><input type="password" formControlName="password"><button [disabled]="form.invalid || busy()">متابعة</button></form><button type="button" (click)="passkey()">المتابعة بـ Passkey</button> }
@else if (!done()) { <button (click)="complete()" [disabled]="busy()">{{ mode() === 'invite' ? 'قبول الدعوة' : 'الانضمام' }}</button> } @else { <p>تمت العملية بنجاح.</p> } }</section>` })
export class IdentityJoinComponent {
 private readonly route=inject(ActivatedRoute); private readonly onboarding=inject(FreelanceOnboardingService); readonly mode=signal<'invite'|'client'>((this.route.snapshot.data['mode'] as 'invite'|'client')||'invite'); readonly preview=signal<Preview|null>(null); readonly token=signal<string|null>(null); readonly loading=signal(true); readonly identity=signal<IdentitySignInResponse|null>(null); readonly busy=signal(false); readonly done=signal(false); readonly form=inject(FormBuilder).nonNullable.group({email:['',[Validators.required,Validators.email]],password:['',Validators.required]});
 constructor(){this.route.fragment.subscribe(fragment=>{const token=new URLSearchParams(fragment||'').get(this.mode()==='invite'?'token':'code');this.token.set(token);const request:Observable<Preview>=this.mode()==='invite'?this.onboarding.previewWorkspaceInvite(token||''):this.onboarding.previewClientJoin(token||'');request.subscribe({next:(value:Preview)=>{this.preview.set(value);this.loading.set(false)},error:()=>this.loading.set(false)});});}
 workspaceName(){return this.preview()?.workspaceName||'';}
 signIn(){if(this.form.invalid)return;const v=this.form.getRawValue();this.authenticate(this.onboarding.identityLogin(v.email,v.password));}
 passkey(){if(this.form.controls.email.invalid)return;this.authenticate(this.onboarding.signInWithPasskey(this.form.controls.email.value));}
 complete(){const token=this.token(),identity=this.identity();if(!token||!identity)return;this.busy.set(true);const request:Observable<unknown>=this.mode()==='invite'?this.onboarding.acceptWorkspaceInvite(token,identity.workspaceSelectionToken):this.onboarding.joinWorkspaceAsClient(token,identity.workspaceSelectionToken);request.subscribe({next:()=>{this.done.set(true);this.busy.set(false)},error:()=>this.busy.set(false)});}
 private authenticate(request:Observable<IdentitySignInResponse>){this.busy.set(true);request.subscribe({next:value=>{this.identity.set(value);this.busy.set(false)},error:()=>this.busy.set(false)});}
}
