import { SubSink } from 'subsink';
import { Category } from '@models/category.model';
import { tap } from 'rxjs/operators';
import { Brand } from '@models/brand.model';
import { Observable } from 'rxjs';
import { Product } from '@models/product.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { BrandsService } from '@services/brands.service';
import { SeoService } from '@services/seo.service';
import { getMetaTags, getCategoryTree } from '@utils';

@Component({
  selector: 'app-brand',
  templateUrl: './brand.component.html',
  styleUrls: ['./brand.component.scss'],
})
export class BrandComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  brand: Brand;
  categories: Category[];

  private subscriptions = new SubSink();

  constructor(
    private route: ActivatedRoute,
    private brandsService: BrandsService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.brand = this.route.snapshot.data.brand;
    this.setMetaData(this.route.snapshot.data.brand);
    this.setupParamsSubscription();
    this.setupQuerySubscription();
  }

  setupParamsSubscription() {
    this.subscriptions.sink = this.route.params.subscribe((params) => {
      this.subscriptions.sink = this.brandsService
        .getBrandProducts(params.brandSlug)
        .subscribe((products) => {
          this.categories = getCategoryTree(products);
          this.products = products;
          this.filteredProducts = products;
        });
    });
  }

  setupQuerySubscription() {
    this.subscriptions.sink = this.route.queryParams.subscribe(
      (query: Params) => {
        this.handleQueryChange(query);
      }
    );
  }

  handleQueryChange(query: Params) {
    for (const field in query) {
      if (Object.prototype.hasOwnProperty.call(query, field)) {
        switch (field) {
          case 'catSlug':
            this.filteredProducts = this.filterProducts(this.products, {
              catSlug: query[field],
            });
            break;
          case 'subCatSlug':
            this.filteredProducts = this.filterProducts(this.products, {
              subCatSlug: query[field],
            });
            break;
          case 'partSlug':
            this.filteredProducts = this.filterProducts(this.products, {
              partSlug: query[field],
            });
            break;
          default:
            break;
        }
      }
    }
  }

  filterProducts(
    products: Product[],
    { catSlug = '', subCatSlug = '', partSlug = '' }
  ): Product[] {
    if (partSlug) {
      return products.filter(({ category: { slug } }) => slug === partSlug);
    }
    if (subCatSlug) {
      return products.filter(
        ({
          category: {
            parent: { slug },
          },
        }) => slug === subCatSlug
      );
    }
    if (catSlug) {
      return products.filter(
        ({
          category: {
            parent: {
              parent: { slug },
            },
          },
        }) => slug === catSlug
      );
    }
    return products;
  }

  setMetaData(brand: Brand) {
    this.seoService.setTitle(brand.metaTitle);
    this.seoService.setMetaTags(getMetaTags(brand));
  }

  isActive(slug: string): boolean {
    return this.route.snapshot.queryParamMap.get('catSlug') === slug;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
