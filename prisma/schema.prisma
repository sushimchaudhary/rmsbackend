generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  staff
  admin
  super_admin
}

enum EmploymentType {
  full_time  @map("full-time")
  part_time  @map("part-time")
  contract
  intern
}

enum StaffStatus {
  active
  inactive
  on_leave   @map("on-leave")
  terminated
}

enum OrderStatus {
  pending
  accepted
  preparing
  served
  completed_settled
  cancelled
  rejected
}

enum PaymentChoice {
  uncommitted
  pay_now
  pay_later
}

enum PaymentMethod {
  esewa
  khalti
  cod
  card
}

enum BillPaymentMethod {
  cash
  card
  digital_wallet
}

enum PaymentStatus {
  pending
  completed
  failed
  refunded
}

enum ItemStatus {
  available
  not_available
}

model Restaurant {
  id            String    @id @default(uuid())
  name          String    @unique
  address       String
  mobile_number String    @unique
  logo          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  branches      Branch[]
  users         User[]
  notices       Notice[]
}

model Branch {
  id            String      @id @default(uuid())
  name          String
  address       String
  mobile_number String
  restaurant_id String
  restaurant    Restaurant  @relation(fields: [restaurant_id], references: [id], onDelete: Cascade)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  users                 User[]
  staffs                Staff[]
  sliderImages          SliderImage[]
  tables                RestaurantTable[]
  projects              Projects[]
  organizationalDetails OrganizationalDetail[]
  orders                Order[]
  notices               Notice[]
  menuItems             MenuItem[]
  galleries             Gallery[]
  categories            Category[]
  bills                 Bill[]
  orderItems            OrderItem[]
}

model User {
  id                  String    @id @default(uuid())
  username            String    @unique
  password            String
  first_name          String?
  last_name           String?
  email               String    @unique
  mobile_number       String?
  address             String?
  role                String    @default("staff")
  super_user          Boolean   @default(false)
  is_admin            Boolean   @default(true)
  is_staff            Boolean   @default(true)
  resetPasswordToken  String?
  resetPasswordExpire DateTime?
  is_blocked          Boolean   @default(false)
  blocked_at          DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  restaurant_id       String?
  restaurant          Restaurant? @relation(fields: [restaurant_id], references: [id])
  branch_id           String?
  branch              Branch?     @relation(fields: [branch_id], references: [id])

  payments            Payment[]
  seenNotices         Notice[]    @relation("UserSeenNotices")
}

model Staff {
  id             String         @id @default(uuid())
  name           String
  email          String         @unique
  phone          String
  designation    String
  image          String?
  joinedDate     DateTime       @default(now())
  
  // Salary Details
  salary_basic      Float
  salary_allowance  Float      @default(0)
  salary_deductions Float      @default(0)

  // Bank Account Details
  bank_name           String?
  bank_account_name   String?
  bank_account_number String?
  bank_branch         String?
  bank_qr_code        String?

  employmentType EmploymentType @default(full_time)
  status         StaffStatus    @default(active)
  order          Int            @default(1)
  
  branch_id      String?
  branch         Branch?        @relation(fields: [branch_id], references: [id])

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}

model SliderImage {
  id        String  @id @default(uuid())
  image     String
  branch_id String?
  branch    Branch? @relation(fields: [branch_id], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model RestaurantTable {
  id           String   @id @default(uuid())
  table_number String   @db.VarChar(10)
  branch_id    String
  qr_code      String?  @db.Text
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  branch Branch @relation(fields: [branch_id], references: [id], onDelete: Cascade)

  orders Order[]

  @@unique([table_number, branch_id])
  @@map("restaurant_tables")
}

model Projects {
  id          String  @id @default(uuid())
  image       String?
  title       String
  description String
  branch_id   String?
  branch      Branch? @relation(fields: [branch_id], references: [id])
}

model OrganizationalDetail {
  id               String   @id @default(uuid())
  logo             String
  title            String
  address          String
  email1           String?
  email2           String?
  website          String?
  description      String?
  contactNo        String
  facebook_url     String?
  twitter_url      String?
  instagram_url    String?
  linkdin_url      String?
  location_url     String?
  telephone_number String
  branch_id        String?
  branch           Branch?  @relation(fields: [branch_id], references: [id])
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model Category {
  id         String     @id @default(uuid())
  name       String
  branch_id  String?
  branch     Branch?    @relation(fields: [branch_id], references: [id])
  created_at DateTime   @default(now())

  menuItems  MenuItem[]
}

model MenuItem {
  id          String          @id @default(uuid())
  name        String
  image       String?
  status      ItemStatus      @default(available)
  created_at  DateTime        @default(now())
  category_id String?
  category    Category?       @relation(fields: [category_id], references: [id], onDelete: SetNull)
  branch_id   String?
  branch      Branch?         @relation(fields: [branch_id], references: [id])
  portions    MenuItemPrice[]
  orderItems  OrderItem[]
}

model MenuItemPrice {
  id           String   @id @default(uuid())
  portion_name String
  price        Decimal
  menu_item_id String
  menuItem     MenuItem @relation(fields: [menu_item_id], references: [id], onDelete: Cascade)
}



model Order {
  id               String        @id @default(uuid())
  order_number     String        @unique
  table_id         String?
  branch_id        String
  status           OrderStatus   @default(pending)
  payment_choice   PaymentChoice @default(uncommitted)
  total_amount     Decimal       @default(0.0) @db.Decimal(10, 2)
  seen             Boolean       @default(false)
  rejection_reason String?
  rating           Int?
  rating_comment   String?
  rated_at         DateTime?
  created_at       DateTime      @default(now())

  // Relations
  table      RestaurantTable? @relation(fields: [table_id], references: [id], onDelete: SetNull)
  branch     Branch           @relation(fields: [branch_id], references: [id], onDelete: Cascade)
  items      OrderItem[]
  payments     Payment[]
  bill       Bill?            // 1-to-1 Relation with Bill

  @@index([branch_id, created_at])
  @@index([branch_id, seen])
  @@map("orders")
}

model OrderItem {
  id                  String   @id @default(uuid())
  order_id            String
  menu_item_id        String
  branch_id           String?
  menu_item_name      String
  category_name       String   @default("Uncategorized")
  menu_item_image     String?
  selected_portion_id String
  portion_name        String
  portion_price       Decimal  @db.Decimal(10, 2)
  quantity            Int      @default(1)

  // Relations
  order     Order    @relation(fields: [order_id], references: [id], onDelete: Cascade)
  menuItem  MenuItem @relation(fields: [menu_item_id], references: [id])
  branch              Branch?  @relation(fields: [branch_id], references: [id], onDelete: Cascade)

  @@map("order_items")
}

model Payment {
  id             String        @id @default(uuid())
  transactionId  String        @unique
  amount         Float
  paymentMethod  PaymentMethod @default(esewa)
  status         PaymentStatus @default(pending)
  paymentDetails Json?
  created_at     DateTime      @default(now())
  updated_at     DateTime      @updatedAt

  order_id       String
  order          Order         @relation(fields: [order_id], references: [id], onDelete: Cascade)
  user_id        String?
  user           User?         @relation(fields: [user_id], references: [id])
}

model Notice {
  id            String     @id @default(uuid())
  title         String
  description   String?    @default("")
  image         String?
  is_active     Boolean    @default(true)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  restaurant_id String
  restaurant    Restaurant @relation(fields: [restaurant_id], references: [id])
  branch_id     String
  branch        Branch     @relation(fields: [branch_id], references: [id])

  seenUsers     User[]     @relation("UserSeenNotices")
}

model Gallery {
  id         String   @id @default(uuid())
  title      String
  image      String
  video_url  String?
  created_at DateTime @default(now())
  branch_id  String?
  branch     Branch?  @relation(fields: [branch_id], references: [id])
}

model Bill {
  id                  String        @id @default(uuid())
  bill_number         String        @unique
  order_id            String        @unique
  branch_id           String
  discount_percentage Decimal       @default(0.0) @db.Decimal(5, 2)
  vat_percentage      Decimal       @default(13.0) @db.Decimal(5, 2)
  sub_total           Decimal       @default(0.0) @db.Decimal(10, 2)
  discount_amount     Decimal       @default(0.0) @db.Decimal(10, 2)
  vat_amount          Decimal       @default(0.0) @db.Decimal(10, 2)
  grand_total         Decimal       @default(0.0) @db.Decimal(10, 2)
  payment_method      BillPaymentMethod @default(cash) 
  is_paid             Boolean       @default(false)
  created_at          DateTime      @default(now())

  // Relations
  order  Order  @relation(fields: [order_id], references: [id], onDelete: Cascade)
  branch Branch @relation(fields: [branch_id], references: [id], onDelete: Cascade)

  @@map("bills")
}