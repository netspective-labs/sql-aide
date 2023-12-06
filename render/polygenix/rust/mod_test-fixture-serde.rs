#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct SyntheticTableWithoutPk {
    text: String, // 'string' maps directly to Rust type
    text_nullable: Option<String>, // 'string' maps directly to Rust type
    int: i64, // 'integer' maps directly to Rust type
    int_nullable: Option<i64>, // 'integer' maps directly to Rust type
}

#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct SyntheticTableWithAutoIncPk {
    auto_inc_primary_key: Option<i64>, // PRIMARY KEY ('integer' maps directly to Rust type)
    text: String, // 'string' maps directly to Rust type
    text_nullable: Option<String>, // 'string' maps directly to Rust type
    int: i64, // 'integer' maps directly to Rust type
    int_nullable: Option<i64>, // 'integer' maps directly to Rust type
}

#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct SyntheticTableWithTextPk {
    text_primary_key: String, // PRIMARY KEY ('string' maps directly to Rust type)
    text: String, // 'string' maps directly to Rust type
    text_nullable: Option<String>, // 'string' maps directly to Rust type
    int: i64, // 'integer' maps directly to Rust type
    int_nullable: Option<i64>, // 'integer' maps directly to Rust type
}

#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct SyntheticTableWithUaodPk {
    ua_on_demand_primary_key: String, // PRIMARY KEY ('string' maps directly to Rust type)
    text: String, // 'string' maps directly to Rust type
    text_nullable: Option<String>, // 'string' maps directly to Rust type
    int: i64, // 'integer' maps directly to Rust type
    int_nullable: Option<i64>, // 'integer' maps directly to Rust type
}

#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct SyntheticTableWithConstraints {
    text_primary_key: String, // PRIMARY KEY ('string' maps directly to Rust type)
    column_unique: String, // 'string' maps directly to Rust type
    created_at: Option<chrono::NaiveDate>, // Using chrono crate for 'date'
}
