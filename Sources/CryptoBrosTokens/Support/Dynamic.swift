import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

@usableFromInline typealias RGBA = (r: Double, g: Double, b: Double, a: Double)

@inlinable func dyn(_ l: RGBA, _ d: RGBA) -> Color {
    #if canImport(UIKit)
    Color(uiColor: UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: d.r, green: d.g, blue: d.b, alpha: d.a)
        : UIColor(red: l.r, green: l.g, blue: l.b, alpha: l.a) })
    #else
    Color(red: l.r, green: l.g, blue: l.b, opacity: l.a)
    #endif
}
