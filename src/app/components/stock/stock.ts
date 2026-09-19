import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Booking, BookingsService } from '../../services/bookings.service';
import { PaymentMethod } from '../../services/payments.service';
import { Product, ProductsService, ProductType } from '../../services/products.service';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
];

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'alquiler', label: 'Alquiler (paletas)' },
  { value: 'venta', label: 'Venta (pelotas, agua, etc.)' },
];

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Stock: listado de productos con aviso de stock bajo (ambos roles), alta/
 * edición/baja de producto (solo admin) y venta (ambos roles) — suelta o
 * asociada a una reserva del día para sumar el monto a esa reserva.
 */
@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './stock.html',
  styleUrl: './stock.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stock implements OnInit {
  private readonly service = inject(ProductsService);
  private readonly bookingsApi = inject(BookingsService);
  private readonly auth = inject(AuthService);

  readonly isAdmin = computed(() => this.auth.isAdmin());
  readonly methods = PAYMENT_METHODS;
  readonly types = PRODUCT_TYPES;

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

  // Alta / edición de producto (admin)
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly fName = signal('');
  readonly fType = signal<ProductType>('venta');
  readonly fStock = signal(0);
  readonly fMinStock = signal(0);
  readonly fPrice = signal(0);
  readonly fSubmitting = signal(false);
  readonly fError = signal('');

  readonly deleteId = signal<string | null>(null);
  readonly deleting = signal(false);

  // Venta de producto (ambos roles)
  readonly showSellForm = signal(false);
  readonly sellingProduct = signal<Product | null>(null);
  readonly sQuantity = signal(1);
  readonly sPaymentMethod = signal<PaymentMethod>('efectivo');
  readonly sAssociateBooking = signal(false);
  readonly sBookingId = signal('');
  readonly sSubmitting = signal(false);
  readonly sError = signal('');

  readonly todayBookings = signal<Booking[]>([]);
  readonly loadingBookings = signal(false);

  ngOnInit(): void {
    this.load();
  }

  private flash(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.getProducts().subscribe({
      next: list => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos. Probá de nuevo.');
        this.loading.set(false);
      },
    });
  }

  // ── Alta / edición (admin) ───────────────────────────────────────────
  openNew(): void {
    this.editingId.set(null);
    this.fName.set('');
    this.fType.set('venta');
    this.fStock.set(0);
    this.fMinStock.set(0);
    this.fPrice.set(0);
    this.fError.set('');
    this.showForm.set(true);
  }

  openEdit(p: Product): void {
    this.editingId.set(p.id);
    this.fName.set(p.name);
    this.fType.set(p.type);
    this.fStock.set(p.stock);
    this.fMinStock.set(p.minStock);
    this.fPrice.set(p.price);
    this.fError.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    if (this.fSubmitting()) return;
    this.showForm.set(false);
  }

  submitForm(): void {
    if (!this.fName().trim()) {
      this.fError.set('Completá el nombre.');
      return;
    }
    if (this.fStock() < 0 || this.fMinStock() < 0) {
      this.fError.set('El stock no puede ser negativo.');
      return;
    }
    if (this.fPrice() <= 0) {
      this.fError.set('El precio tiene que ser mayor a 0.');
      return;
    }

    const body = {
      name: this.fName().trim(),
      type: this.fType(),
      stock: this.fStock(),
      minStock: this.fMinStock(),
      price: this.fPrice(),
    };
    const editId = this.editingId();

    this.fSubmitting.set(true);
    this.fError.set('');

    const req = editId ? this.service.updateProduct(editId, body) : this.service.createProduct(body);
    req.subscribe({
      next: () => {
        this.fSubmitting.set(false);
        this.showForm.set(false);
        this.flash(editId ? 'Producto actualizado.' : 'Producto creado.');
        this.load();
      },
      error: err => {
        this.fSubmitting.set(false);
        this.fError.set(err?.error?.error ?? 'No se pudo guardar el producto. Probá de nuevo.');
      },
    });
  }

  askDelete(id: string): void {
    this.deleteId.set(id);
  }

  cancelDelete(): void {
    this.deleteId.set(null);
  }

  confirmDelete(): void {
    const id = this.deleteId();
    if (!id || this.deleting()) return;
    this.deleting.set(true);
    this.service.deleteProduct(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteId.set(null);
        this.flash('Producto eliminado.');
        this.load();
      },
      error: () => {
        this.deleting.set(false);
        this.deleteId.set(null);
      },
    });
  }

  // ── Venta (ambos roles) ──────────────────────────────────────────────
  openSell(p: Product): void {
    this.sellingProduct.set(p);
    this.sQuantity.set(1);
    this.sPaymentMethod.set('efectivo');
    this.sAssociateBooking.set(false);
    this.sBookingId.set('');
    this.sError.set('');
    this.showSellForm.set(true);
    if (this.todayBookings().length === 0) this.loadTodayBookings();
  }

  closeSell(): void {
    if (this.sSubmitting()) return;
    this.showSellForm.set(false);
  }

  loadTodayBookings(): void {
    this.loadingBookings.set(true);
    this.bookingsApi.getBookings(todayIso()).subscribe({
      next: list => {
        this.todayBookings.set(list.filter(b => b.status === 'confirmed'));
        this.loadingBookings.set(false);
      },
      error: () => {
        this.loadingBookings.set(false);
      },
    });
  }

  toggleAssociate(value: boolean): void {
    this.sAssociateBooking.set(value);
    if (!value) this.sBookingId.set('');
  }

  submitSell(): void {
    const product = this.sellingProduct();
    if (!product || this.sSubmitting()) return;

    if (this.sQuantity() <= 0) {
      this.sError.set('La cantidad tiene que ser mayor a 0.');
      return;
    }
    if (this.sQuantity() > product.stock) {
      this.sError.set('No hay stock suficiente para esta venta.');
      return;
    }
    if (this.sAssociateBooking() && !this.sBookingId()) {
      this.sError.set('Elegí a qué reserva asociar la venta.');
      return;
    }

    this.sSubmitting.set(true);
    this.sError.set('');

    this.service
      .sellProduct({
        productId: product.id,
        quantity: this.sQuantity(),
        paymentMethod: this.sPaymentMethod(),
        bookingId: this.sAssociateBooking() ? this.sBookingId() : undefined,
      })
      .subscribe({
        next: () => {
          this.sSubmitting.set(false);
          this.showSellForm.set(false);
          this.flash(`Venta registrada: ${this.sQuantity()} × ${product.name}.`);
          this.load();
        },
        error: err => {
          this.sSubmitting.set(false);
          this.sError.set(err?.error?.error ?? 'No se pudo registrar la venta. Probá de nuevo.');
        },
      });
  }
}
