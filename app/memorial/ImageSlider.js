import React from "react";

const images = [
  "/images/img1.png",
  "/images/img2.png",
  "/images/img3.png",
  "/images/img4.png",
  "/images/img5.png",
  "/images/img6.png",
  "/images/img7.png",
  "/images/img8.png",
  "/images/img9.png",
];

const ImageSlider = () => {
  return (
    <div style={styles.sliderContainer}>
      <div style={styles.slider}>
        {images.concat(images).map((src, index) => (

            <img src={src} alt={`slide-${index}`} style={styles.image} />

        ))}
        
      </div>
    </div>
  );
};

const styles = {
  sliderContainer: {
    width: "200vw",
    marginTop:"50px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    position: "relative",
  },
  slider: {
    display: "flex",
    animation: "scroll 15s linear infinite",
  },
  slide: {
    flexShrink: 0,
    width: "50vw",
  },
  image: {
    height: "50vh",
    objectFit: "cover",
  },
};

// CSS 애니메이션 추가
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @keyframes scroll {
    from { transform: translateX(0%); }
    to { transform: translateX(-100%); }
  }
`;
document.head.appendChild(styleTag);

export default ImageSlider;
