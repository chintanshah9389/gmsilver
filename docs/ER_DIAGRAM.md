# GM Silver — ER Diagram & Database Design

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            GM SILVER DATABASE                                │
└──────────────────────────────────────────────────────────────────────────────┘

users
─────────────────────────────────────────
PK  id            UUID
    email         VARCHAR UNIQUE
    phone         VARCHAR UNIQUE NULL
    password      VARCHAR (bcrypt)
    mpin          VARCHAR NULL (bcrypt)
    name          VARCHAR
    role          ENUM(ADMIN,OWNER,CUSTOMER)
    status        ENUM(PENDING,APPROVED,REJECTED,BLOCKED)
    fcm_token     VARCHAR NULL
    device_details JSONB NULL
    created_at    TIMESTAMP
    updated_at    TIMESTAMP
    deleted_at    TIMESTAMP NULL

categories
─────────────────────────────────────────
PK  id            UUID
    name          VARCHAR
    description   TEXT NULL
    image_url     VARCHAR NULL
    storage_key   VARCHAR NULL
    is_active     BOOLEAN DEFAULT true
    sort_order    INT DEFAULT 0
    created_at    TIMESTAMP
    updated_at    TIMESTAMP
    deleted_at    TIMESTAMP NULL

products
─────────────────────────────────────────
PK  id            UUID
FK  category_id   UUID → categories.id
    name          VARCHAR
    description   TEXT NULL
    price         DECIMAL(10,2)
    weight        DECIMAL(10,3) NULL
    purity        VARCHAR NULL
    sku           VARCHAR UNIQUE NULL
    image_url     VARCHAR NULL
    storage_key   VARCHAR NULL
    is_available  BOOLEAN DEFAULT true
    is_active     BOOLEAN DEFAULT true
    created_at    TIMESTAMP
    updated_at    TIMESTAMP
    deleted_at    TIMESTAMP NULL

product_images
─────────────────────────────────────────
PK  id            UUID
FK  product_id    UUID → products.id
    image_url     VARCHAR
    storage_key   VARCHAR
    is_primary    BOOLEAN DEFAULT false
    sort_order    INT DEFAULT 0
    created_at    TIMESTAMP
    updated_at    TIMESTAMP

wishlist
─────────────────────────────────────────
PK  id            UUID
FK  user_id       UUID → users.id
FK  product_id    UUID → products.id
    created_at    TIMESTAMP
    UNIQUE(user_id, product_id)

cart
─────────────────────────────────────────
PK  id            UUID
FK  user_id       UUID → users.id UNIQUE
    created_at    TIMESTAMP
    updated_at    TIMESTAMP

cart_items
─────────────────────────────────────────
PK  id            UUID
FK  cart_id       UUID → cart.id
FK  product_id    UUID → products.id
    quantity      INT DEFAULT 1
    created_at    TIMESTAMP
    updated_at    TIMESTAMP
    UNIQUE(cart_id, product_id)

orders
─────────────────────────────────────────
PK  id            UUID
FK  user_id       UUID → users.id
    order_number  VARCHAR UNIQUE
    status        ENUM(PENDING,APPROVED,REJECTED,CANCELLED,COMPLETED)
    total_amount  DECIMAL(10,2)
    gst_amount    DECIMAL(10,2) NULL
    grand_total   DECIMAL(10,2)
    notes         TEXT NULL
    created_at    TIMESTAMP
    updated_at    TIMESTAMP
    deleted_at    TIMESTAMP NULL

order_items
─────────────────────────────────────────
PK  id            UUID
FK  order_id      UUID → orders.id
FK  product_id    UUID → products.id
    quantity      INT
    rate          DECIMAL(10,2)
    amount        DECIMAL(10,2)
    created_at    TIMESTAMP

invoices
─────────────────────────────────────────
PK  id            UUID
FK  order_id      UUID → orders.id UNIQUE
    invoice_number VARCHAR UNIQUE
    pdf_url       VARCHAR
    storage_key   VARCHAR
    created_at    TIMESTAMP
    updated_at    TIMESTAMP

notifications
─────────────────────────────────────────
PK  id            UUID
    title         VARCHAR
    body          TEXT
    type          ENUM(USER_APPROVED,ORDER_CREATED,ORDER_APPROVED,
                       ORDER_REJECTED,ORDER_COMPLETED,NEW_PRODUCT,BROADCAST)
    data          JSONB NULL
    created_at    TIMESTAMP

notification_logs
─────────────────────────────────────────
PK  id               UUID
FK  notification_id  UUID → notifications.id
FK  user_id          UUID → users.id
    is_read          BOOLEAN DEFAULT false
    read_at          TIMESTAMP NULL
    created_at       TIMESTAMP

refresh_tokens
─────────────────────────────────────────
PK  id            UUID
FK  user_id       UUID → users.id
    token         VARCHAR UNIQUE
    expires_at    TIMESTAMP
    is_revoked    BOOLEAN DEFAULT false
    created_at    TIMESTAMP

mpin_tokens
─────────────────────────────────────────
PK  id            UUID
FK  user_id       UUID → users.id
    device_id     VARCHAR
    expires_at    TIMESTAMP
    is_active     BOOLEAN DEFAULT true
    created_at    TIMESTAMP
    updated_at    TIMESTAMP
    UNIQUE(user_id, device_id)

audit_logs
─────────────────────────────────────────
PK  id            UUID
FK  user_id       UUID → users.id NULL
    action        VARCHAR
    module        VARCHAR
    data          JSONB NULL
    ip_address    VARCHAR NULL
    user_agent    TEXT NULL
    device_details JSONB NULL
    created_at    TIMESTAMP

─────────────────────────────────────────────────────────────────────
RELATIONSHIPS
─────────────────────────────────────────────────────────────────────

users           ──1:M──> orders
users           ──1:M──> wishlist
users           ──1:1──> cart
users           ──1:M──> refresh_tokens
users           ──1:M──> mpin_tokens
users           ──1:M──> audit_logs
users           ──1:M──> notification_logs

categories      ──1:M──> products

products        ──1:M──> product_images
products        ──1:M──> wishlist
products        ──1:M──> cart_items
products        ──1:M──> order_items

cart            ──1:M──> cart_items

orders          ──1:M──> order_items
orders          ──1:1──> invoices

notifications   ──1:M──> notification_logs
```

## Index Strategy

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);

-- Products  
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_availability ON products(is_available, is_active);
CREATE INDEX idx_products_sku ON products(sku);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Notifications
CREATE INDEX idx_notification_logs_user_read ON notification_logs(user_id, is_read);

-- Refresh Tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```
