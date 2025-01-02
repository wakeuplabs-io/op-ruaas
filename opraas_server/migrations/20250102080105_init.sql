-- Add migration script here
CREATE TABLE deployments (
    id TEXT PRIMARY KEY, -- Unique identifier
    owner_id TEXT NOT NULL, -- Owner ID
    release_tag TEXT NOT NULL, -- Release tag
    release_registry TEXT NOT NULL, -- Release registry
    network_config TEXT NOT NULL, -- TEXT for serialized network configuration
    accounts_config TEXT NOT NULL, -- TEXT for serialized accounts configuration
    infra_base_url TEXT, -- Optional base URL
    contracts_addresses TEXT -- Optional contract addresses
);
