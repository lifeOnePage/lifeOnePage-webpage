/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // 최적화 비활성화
  },
};

// CommonJS -> module.exports = nextConfig;
//     (사용 불가, ES module scope 오류)
// ES Module -> export default nextConfig;
export default nextConfig;
