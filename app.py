from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

TEXT_TO_MORSE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..',
    'E': '.',  'F': '..-.', 'G': '--.',  'H': '....',
    'I': '..', 'J': '.---', 'K': '-.-',  'L': '.-..',
    'M': '--', 'N': '-.',   'O': '---',  'P': '.--.',
    'Q': '--.-','R': '.-.', 'S': '...',  'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--','Z': '--..',
    '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....',
    '7': '--...', '8': '---..', '9': '----.',
    '0': '-----', ' ': '/'
}

# Inverse dictionary
MORSE_TO_TEXT = {v: k for k, v in TEXT_TO_MORSE.items()}

def auto_translate(text):
    # If it contains only dots, dashes, and slashes, assume Morse
    if all(char in '.-/ ' for char in text.strip()):
        return morse_to_text(text)
    else:
        return text_to_morse(text)

def text_to_morse(text):
    return ' '.join(TEXT_TO_MORSE.get(char.upper(), '') for char in text)

def morse_to_text(morse):
    words = morse.strip().split(' / ')
    decoded = []
    for word in words:
        chars = word.split()
        decoded_word = ''.join(MORSE_TO_TEXT.get(char, '') for char in chars)
        decoded.append(decoded_word)
    return ' '.join(decoded)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/translator')
def translator():
    return render_template('translator.html')  

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/history')
def history():
    return render_template('history.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    text = data.get('text', '')
    result = auto_translate(text)
    return jsonify({'result': result})


if __name__ == '__main__':
    app.run(debug=True)
