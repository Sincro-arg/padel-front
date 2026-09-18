import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MembersService, Member, MemberPayment } from './members.service';
import { environment } from '../../environments/environment';

describe('MembersService', () => {
  let service: MembersService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/members`;

  const member: Member = {
    id: 'm1',
    name: 'Juan',
    phone: '111',
    membershipFee: 5000,
    discountPercent: 10,
    monthsOwed: 0,
    isBlocked: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MembersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getMembers pide GET /members', () => {
    let result: Member[] | undefined;
    service.getMembers().subscribe(r => (result = r));

    httpMock.expectOne({ url: base, method: 'GET' }).flush([member]);
    expect(result).toEqual([member]);
  });

  it('createMember hace POST con el body', () => {
    const body = { name: 'Juan', phone: '111', membershipFee: 5000, discountPercent: 10 };
    service.createMember(body).subscribe();

    const req = httpMock.expectOne({ url: base, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush(member);
  });

  it('updateMember hace PUT a /members/{id}', () => {
    const body = { name: 'Juan', phone: '111', membershipFee: 6000, discountPercent: 15 };
    service.updateMember('m1', body).subscribe();

    const req = httpMock.expectOne({ url: `${base}/m1`, method: 'PUT' });
    expect(req.request.body).toEqual(body);
    req.flush(member);
  });

  it('deleteMember hace DELETE a /members/{id}', () => {
    service.deleteMember('m1').subscribe();
    httpMock.expectOne({ url: `${base}/m1`, method: 'DELETE' }).flush(null);
  });

  it('getPayments pide GET /members/{id}/payments', () => {
    const payments: MemberPayment[] = [
      { id: 'p1', memberId: 'm1', month: 9, year: 2026, amount: 5000, paymentMethod: 'efectivo', paidAt: '2026-09-18' },
    ];

    let result: MemberPayment[] | undefined;
    service.getPayments('m1').subscribe(r => (result = r));

    httpMock.expectOne({ url: `${base}/m1/payments`, method: 'GET' }).flush(payments);
    expect(result).toEqual(payments);
  });

  it('createPayment hace POST a /members/{id}/payments con el body', () => {
    const body = { month: 9, year: 2026, amount: 5000, paymentMethod: 'efectivo' as const };
    service.createPayment('m1', body).subscribe();

    const req = httpMock.expectOne({ url: `${base}/m1/payments`, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'p1', memberId: 'm1', ...body, paidAt: '2026-09-18' });
  });

  it('updatePayment hace PUT a /members/{id}/payments/{paymentId} con el body', () => {
    const body = { month: 9, year: 2026, amount: 6000, paymentMethod: 'transferencia' as const };
    service.updatePayment('m1', 'p1', body).subscribe();

    const req = httpMock.expectOne({ url: `${base}/m1/payments/p1`, method: 'PUT' });
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'p1', memberId: 'm1', ...body, paidAt: '2026-09-18' });
  });

  it('deletePayment hace DELETE a /members/{id}/payments/{paymentId}', () => {
    service.deletePayment('m1', 'p1').subscribe();
    httpMock.expectOne({ url: `${base}/m1/payments/p1`, method: 'DELETE' }).flush(null);
  });
});
