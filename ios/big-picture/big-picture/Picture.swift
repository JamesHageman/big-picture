//
//  Picture.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-23.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import Foundation
import UIKit

class Picture: AnyObject {
    
    var image : UIImage?
    var imageID : String
    var colors : [UIColor]
    var size : Int
    var imageLoadedCallback : ((img : UIImage) -> Void)? {
        didSet {
            if let img = self.image, cb = self.imageLoadedCallback {
                cb(img: img)
            }
        }
    }
    
    init(dict: NSDictionary) {
        imageID = dict.objectForKey("_id") as! String
        colors = [UIColor]()
        size = dict.objectForKey("size") as! Int
        let colorStrings = dict.objectForKey("colors") as! [String]
        setImageFromURL("http:" + SocketDelegate.urlBase + (dict.objectForKey("imageURL") as! String))
        for colorString in colorStrings {
            colors.append(colorWithHexString(colorString))
        }
    }
    
    func setImageFromURL(url : String) {
        let req : NSURLRequest = NSURLRequest(URL: NSURL(string: url)!)
        NSURLSession.sharedSession().dataTaskWithRequest(req) { (data: NSData?, res: NSURLResponse?, err: NSError?) -> Void in
            self.image = UIImage(data: data!)!
            if let cb = self.imageLoadedCallback, img = self.image {
                cb(img: img)
            }
        }.resume()
    }
    
    func colorWithHexString (hex:String) -> UIColor {
        var cString:String = hex.stringByTrimmingCharactersInSet(NSCharacterSet.whitespaceAndNewlineCharacterSet()).uppercaseString
        
        if (cString.hasPrefix("#")) {
            cString = cString.substringFromIndex(cString.startIndex.advancedBy(1))
        }
        
        if (cString.characters.count != 6) {
            return UIColor.grayColor()
        }
        
        let rString = cString.substringToIndex(cString.startIndex.advancedBy(2))
        let gString = cString.substringFromIndex(cString.startIndex.advancedBy(2)).substringToIndex(cString.startIndex.advancedBy(2))
        let bString = cString.substringFromIndex(cString.startIndex.advancedBy(4)).substringToIndex(cString.startIndex.advancedBy(2))
        
        var r:CUnsignedInt = 0, g:CUnsignedInt = 0, b:CUnsignedInt = 0;
        NSScanner(string: rString).scanHexInt(&r)
        NSScanner(string: gString).scanHexInt(&g)
        NSScanner(string: bString).scanHexInt(&b)
        
        return UIColor(red: CGFloat(r) / CGFloat(255.0), green: CGFloat(g) / CGFloat(255.0), blue: CGFloat(b) / CGFloat(255.0), alpha: CGFloat(1))
    }
}
