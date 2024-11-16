import cv2
from imutils.perspective import four_point_transform

def scan_detection(image):
    global document_contour
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, threshold = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(threshold, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    max_contour = max(contours, key=cv2.contourArea)
    perimeter = cv2.arcLength(max_contour, True)
    epsilon = 0.03 * perimeter
    document_contour = cv2.approxPolyDP(max_contour, epsilon, True)

    return document_contour

def main(image_path):
    frame = cv2.imread(image_path)
    frame_copy = frame.copy()
    document_contour = scan_detection(frame_copy)
    warped = four_point_transform(frame_copy, document_contour.reshape(4, 2))
    cv2.imwrite(image_path, warped)