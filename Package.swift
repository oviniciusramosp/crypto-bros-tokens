// swift-tools-version: 6.0
import PackageDescription
let package = Package(
    name: "CryptoBrosTokens",
    platforms: [.iOS(.v18)],
    products: [.library(name: "CryptoBrosTokens", targets: ["CryptoBrosTokens"])],
    targets: [.target(name: "CryptoBrosTokens", resources: [.copy("Resources/Fonts")])]
)
