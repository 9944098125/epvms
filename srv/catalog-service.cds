using {epvms.Vendors as VendorEntity} from '../db/schema';

service CatalogService {
   entity Vendors as projection on VendorEntity;
}