use std::time::Duration;
use indicatif::{ProgressBar, ProgressStyle};

pub fn style_spinner(spinner: ProgressBar, message: &str) -> ProgressBar {
    spinner.set_style(ProgressStyle::with_template("{spinner:.blue} {msg}").unwrap());
    spinner.set_message(message.to_string());
    spinner.enable_steady_tick(Duration::from_millis(100));
    spinner.tick();

    spinner
}
