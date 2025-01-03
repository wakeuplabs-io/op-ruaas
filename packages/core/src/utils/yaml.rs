use serde_yaml::{to_writer, Mapping, Value};
use std::collections::HashMap;
use std::fs::File;
use std::path::Path;

pub fn rewrite_yaml_to<T, U>(from: T, to: U, updates: &HashMap<&str, Value>) -> Result<(), Box<dyn std::error::Error>>
where
    T: AsRef<Path>,
    U: AsRef<Path>,
{
    let file = File::open(from)?;
    let mut yaml: Value = serde_yaml::from_reader(file)?;

    // Loop through all the updates and apply them
    for (key, new_value) in updates {
        // Split the key by '.' to access nested fields
        let keys: Vec<&str> = key.split('.').collect();

        // Update the value in the nested structure
        let mut current = &mut yaml;
        for (i, key_part) in keys.iter().enumerate() {
            // If we're at the last part of the key, update the value
            if i == keys.len() - 1 {
                if let Value::Mapping(map) = current {
                    map.insert(Value::String(key_part.to_string()), new_value.clone());
                }
            } else {
                // Otherwise, move deeper into the structure
                if let Value::Mapping(map) = current {
                    current = map
                        .entry(Value::String(key_part.to_string()))
                        .or_insert(Value::Mapping(serde_yaml::Mapping::new()));
                }
            }
        }
    }

    // replace self... references
    let mut updated_yaml = yaml.clone();
    resolve_self_references(&mut updated_yaml, &yaml.as_mapping().unwrap())?;

    // Write the updated YAML back to the file
    let mut file = File::create(to)?;
    to_writer(&mut file, &updated_yaml)?;

    Ok(())
}

pub fn resolve_self_references(value: &mut Value, context: &Mapping) -> Result<(), Box<dyn std::error::Error>> {
    match value {
        Value::String(s) if s.starts_with("self.") => {
            // Handle `self.` references by extracting the key path
            if let Some(resolved_value) = resolve_path(context, &s[5..]) {
                *value = resolved_value.clone();
            } else {
                return Err(format!("Failed to resolve self-reference: {}", s).into());
            }
        }
        Value::Mapping(map) => {
            for val in map.values_mut() {
                resolve_self_references(val, context)?;
            }
        }
        Value::Sequence(seq) => {
            for val in seq {
                resolve_self_references(val, context)?;
            }
        }
        _ => {}
    }

    Ok(())
}

pub fn resolve_path<'a>(context: &'a Mapping, path: &str) -> Option<&'a Value> {
    let mut current = context;
    for part in path.split('.') {
        if let Some(Value::Mapping(map)) = current.get(&Value::String(part.to_string())) {
            current = map;
        } else {
            return current.get(&Value::String(part.to_string()));
        }
    }
    None
}
