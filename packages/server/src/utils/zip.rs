use std::{
    fs,
    io::{Cursor, Write},
};
use zip::ZipWriter;

pub fn zip_folder(folder: &std::path::PathBuf) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let mut buffer = Vec::new();

    {
        let mut zip = ZipWriter::new(Cursor::new(&mut buffer));

        for entry in fs::read_dir(folder)? {
            let path = entry.unwrap().path();
            if path.is_file() {
                zip.start_file(
                    path.file_name().unwrap().to_string_lossy(),
                    Default::default(),
                )?;
                zip.write(&fs::read(path)?)?;
            }
        }

        zip.finish()?;
    }

    Ok(buffer)
}
