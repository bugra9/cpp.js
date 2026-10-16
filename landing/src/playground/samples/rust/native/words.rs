// A pub struct with its impl arrives as a class, with `new` as
// its constructor, and a pub fn as a function. Names written in
// snake_case are camelCase in JavaScript.
pub struct Tally {
    words: Vec<String>,
}

impl Tally {
    pub fn new() -> Self {
        Tally { words: Vec::new() }
    }

    pub fn add(&mut self, text: &str) {
        for word in text.split_whitespace() {
            self.words.push(word.to_string());
        }
    }

    pub fn longest(&self) -> Option<String> {
        self.words.iter().max_by_key(|word| word.len()).cloned()
    }

    pub fn words(&self) -> Vec<String> {
        self.words.clone()
    }
}

pub fn parse_score(text: &str) -> Result<i32, String> {
    match text.parse::<i32>() {
        Ok(score) if (0..=100).contains(&score) => Ok(score),
        Ok(score) => Err(format!("{score} is out of range")),
        Err(_) => Err(format!("{text} is not a number")),
    }
}
