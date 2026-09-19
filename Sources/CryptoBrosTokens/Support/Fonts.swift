import SwiftUI
#if canImport(UIKit)
import UIKit
#endif
import CoreText

public enum CBFonts {
    public static func registerFonts() {
        for name in ["InterVariable", "InterVariable-Italic", "cryptobros-icons"] {
            guard let url = Bundle.module.url(forResource: name, withExtension: "ttf", subdirectory: "Fonts") else { continue }
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }

    // 🤔 iOS 18: verify named-instance PostScript names resolve via UIFont(name:); untested outside Xcode/Simulator.
    // Fallback: Font.custom("InterVariable", size:).weight(w).
    static func name(for w: Font.Weight) -> String {
        switch w {
        case .bold: "InterVariable-Bold"
        case .semibold: "InterVariable-SemiBold"
        case .medium: "InterVariable-Medium"
        default: "InterVariable"
        }
    }
}

public struct CBTextStyle: Sendable {
    public let size, lineHeight, letterSpacing: CGFloat
    public let weight: Font.Weight
    public let relativeTo: Font.TextStyle
    public init(size: CGFloat, lineHeight: CGFloat, weight: Font.Weight, letterSpacing: CGFloat, relativeTo: Font.TextStyle) {
        self.size = size; self.lineHeight = lineHeight; self.weight = weight
        self.letterSpacing = letterSpacing; self.relativeTo = relativeTo
    }
    public var font: Font { .custom(CBFonts.name(for: weight), size: size, relativeTo: relativeTo) }
    public var fixedFont: Font { .custom(CBFonts.name(for: weight), fixedSize: size) }
}
