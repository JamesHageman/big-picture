//
//  SocketDelegate.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-23.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import Foundation
import Socket_IO_Client_Swift

class SocketDelegate: AnyObject {
    
    static let urlBase = "192.168.43.150:8080"
    let socket : SocketIOClient
    var imgCallback : ((picture: Picture) -> Void)?
    var lastPixelArray : [[Int]]?
    var updateTimer : NSTimer?
    weak var pictureDrawVC : PictureDrawViewController! {
        didSet {
            updateTimer = NSTimer.scheduledTimerWithTimeInterval(NSTimeInterval(5), target: self, selector: "updateProgress", userInfo: nil, repeats: true)
        }
    }
    weak var mainMenuVC : MainMenuViewController!
    
    init(url: String, menuVC: MainMenuViewController) {
        socket = SocketIOClient(socketURL: url)
        mainMenuVC = menuVC
        setInitialHandlers()
        socket.connect()
    }
    
    func setInitialHandlers() {
        socket.on("newPicture") { (data: [AnyObject], ack: SocketAckEmitter?) -> Void in
            let picture : Picture = Picture(dict: data[0] as! NSDictionary) //{ imageURL, colors[], _id }
            if let callBack = self.imgCallback {
                callBack(picture: picture)
            }
        }
        
        socket.on("serverError") { (data: [AnyObject], ack: SocketAckEmitter?) -> Void in
            let msg = data[0] as! String
            let alertVC = UIAlertController(title: "Alert", message: msg, preferredStyle: UIAlertControllerStyle.Alert)
            alertVC.addAction(UIAlertAction(title: "Ok", style: UIAlertActionStyle.Default, handler: { (action: UIAlertAction) -> Void in
                alertVC.dismissViewControllerAnimated(true, completion: nil)
            }))
            if let rootVC = UIApplication.sharedApplication().delegate!.window!?.rootViewController {
                rootVC.presentViewController(alertVC, animated: true, completion: nil)
            }
        }
        
        socket.on("getImages") { (data: [AnyObject], ack: SocketAckEmitter?) -> Void in
            if let dict = data[0] as? NSDictionary {
                let compl = dict.objectForKey("complete") as! NSArray
                let inProg = dict.objectForKey("inProgress") as! NSArray
                var completedPictures = [Picture]()
                var worksInProgress = [Picture]()
                for dataDict in compl {
                    completedPictures.append(Picture(dict: dataDict as! NSDictionary))
                }
                for var i = 0; i < inProg.count; i++ {
                    worksInProgress.append(Picture(dict: inProg[i] as! NSDictionary))
                }
                dispatch_async(dispatch_get_main_queue(),{
                    self.mainMenuVC.receivePictures(worksInProgress, comp: completedPictures)
                })
            }
        }
        
        socket.on("connect") { (data: [AnyObject], ack: SocketAckEmitter?) -> Void in
           self.requestImages()
        }
        
        socket.onAny {print("Got event: \($0.event), with items: \($0.items)")}
    }
    
    @objc func updateProgress() {
        if let newPixelArray = pictureDrawVC?.pictureDrawView.pictureStateStack.last {
            if (lastPixelArray == nil || newPixelArray != lastPixelArray!) {
                let dict = NSDictionary(dictionaryLiteral: ("_id", pictureDrawVC!.imageID), ("pixels", newPixelArray))
                lastPixelArray = newPixelArray
                socket.emit("updatePicture", dict)
            }
        }
    }
    
    func submitImage() {
        if let newPixelArray = pictureDrawVC?.pictureDrawView.pictureStateStack.last {
            if (lastPixelArray == nil || newPixelArray != lastPixelArray!) {
                let dict = NSDictionary(dictionaryLiteral: ("_id", pictureDrawVC!.imageID), ("pixels", newPixelArray))
                lastPixelArray = newPixelArray
                socket.emit("savePicture", dict)
            }
        }
    }
    
    func askForImage(callBack: (picture: Picture) -> Void) {
        imgCallback = callBack
        socket.emit("requestPicture")
    }
    
    func askForImageWithId(id: String, callBack: (picture: Picture) -> Void) {
        imgCallback = callBack
        socket.emit("requestPicture", id)
    }
    
    func requestImages() {
        socket.emit("requestImages")
    }
}