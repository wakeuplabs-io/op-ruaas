use std::io::{Error, ErrorKind};
use std::thread;

pub fn join_threads<T>(handles: Vec<thread::JoinHandle<Result<T, String>>>) -> Result<(), Error> {
    for handle in handles {
        handle
            .join()
            .map_err(|_| Error::new(ErrorKind::Other, "Thread panicked"))?
            .map_err(|e| Error::new(ErrorKind::Other, e))?;
    }
    Ok(())
}
