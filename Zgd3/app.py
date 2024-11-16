import os
from flask import Flask, request, url_for, render_template, session, send_from_directory
import uuid
import scanner
import gradeAI

app = Flask(__name__)
app.secret_key = 'your_secret_key'
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

answer = []

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())

    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], session['user_id'])
    if not os.path.exists(user_folder):
        os.makedirs(user_folder)

    image_url = session.get('image_url')
    image_urls2 = session.get('image_urls2', [])

    if request.method == 'POST':
        global answer
        if 'image1' in request.files:
            file = request.files['image1']
            if file.filename != '':
                filename = "AnswerKey.png"
                file_path = os.path.join(user_folder, filename)
                file.save(file_path)
                scanner.main(file_path)
                answer = gradeAI.answerkeyscan(file_path)
                image_url = url_for('uploaded_file', filename=session['user_id'] + '/' + filename)
                session['image_url'] = image_url

        if 'image2' in request.files:
            files = request.files.getlist('image2')
            image_urls2 = []
            for index, file in enumerate(files):
                if file.filename != '':
                    filename = f"Answer_{index + 1}.png"
                    file_path = os.path.join(user_folder, filename)
                    file.save(file_path)
                    scanner.main(file_path)
                    print(gradeAI.grading(file_path, answer))
                    image_url2 = url_for('uploaded_file', filename=session['user_id'] + '/' + filename)
                    image_urls2.append(image_url2)

            session['image_urls2'] = image_urls2

    return render_template('index.html', image_url=image_url, image_urls2=image_urls2)

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)
